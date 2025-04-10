const GoogleFactCheckAPI = require("../apis/google-factcheck");
const CachedResult = require("../models/cachedResult.model");
const Verification = require("../models/verification.model");
const OfficialSource = require("../models/officialSource.model");
const { generateClaimHash } = require("../utils/hashing");
const logger = require("../utils/logger");

class FactCheckService {
  constructor() {
    this.googleAPI = new GoogleFactCheckAPI(process.env.GOOGLE_API_KEY);
  }

  async verifyClaim(claimText, category, language = "en") {
    const claimHash = generateClaimHash(claimText);

    const cached = await CachedResult.findOne({ claimHash }).populate({
      path: "verificationId",
      select: "verdict explanation sources confidenceScore",
    });

    if (cached) {
      await CachedResult.updateOne(
        { _id: cached._id },
        { $set: { lastAccessed: new Date() }, $inc: { accessCount: 1 } }
      );

      const verification = cached.verificationId.toObject();
      if (language !== "en") {
        verification.explanation = `[${language}] ${verification.explanation}`;
      }

      return verification;
    }

    const googleResult = await this.checkGoogleFactCheck(claimText, language);

    const officialResults = await this.checkOfficialSources(
      claimText,
      category,
      language
    );

    const verdict = this.analyzeResults(googleResult, officialResults);

    const verificationDoc = new Verification(verdict);
    await verificationDoc.save();

    await CachedResult.findOneAndUpdate(
      { claimHash },
      {
        verificationId: verificationDoc._id,
        lastAccessed: new Date(),
        accessCount: 1,
        $addToSet: { languagesAvailable: language },
      },
      { upsert: true, new: true }
    );

    return verdict;
  }

  async checkGoogleFactCheck(claimText, language) {
    try {
      const params = new URLSearchParams({
        key: process.env.GOOGLE_FACTCHECK_API_KEY,
        query: claimText,
        languageCode: language,
      });

      const response = await axios.get(`${this.googleFactCheckUrl}?${params}`);
      return response.data;
    } catch (error) {
      logger.error("Google FactCheck API error:", error);
      return null;
    }
  }

  async checkOfficialSources(claimText, category, language) {
    const sources = await OfficialSource.find({
      category,
      language,
    }).lean();

    const results = [];

    for (const source of sources) {
      try {
        if (source.apiEndpoint) {
          const response = await axios.get(source.apiEndpoint, {
            params: { query: claimText },
            headers: this.getAuthHeaders(source),
            timeout: 5000,
          });

          if (response.data && response.data.matches) {
            results.push(...response.data.matches);
          }
        }
      } catch (error) {
        logger.error(`Error querying source ${source.name}:`, error);
      }
    }

    return results;
  }

  getAuthHeaders(source) {
    if (source.authenticationMethod === "api_key") {
      const apiKey = process.env[`${source.name}_API_KEY`];
      return { Authorization: `Bearer ${apiKey}` };
    }
    return {};
  }

  getAuthHeaders(source) {
    if (source.authenticationMethod === "api_key") {
      const apiKey = process.env[`${source.name}_API_KEY`];
      if (!apiKey) {
        logger.error(`Missing API key for source: ${source.name}`);
        throw new Error(
          `Configuration error: Missing API key for ${source.name}`
        );
      }
      return { Authorization: `Bearer ${apiKey}` };
    }
    return {};
  }

  analyzeResults(googleResult, officialResults) {
    if (officialResults.length > 0) {
      const verdictCounts = officialResults.reduce((acc, result) => {
        acc[result.verdict] = (acc[result.verdict] || 0) + 1;
        return acc;
      }, {});

      const majorityVerdict = Object.entries(verdictCounts).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      const majorityResults = officialResults.filter(
        (r) => r.verdict === majorityVerdict
      );

      return {
        verdict: majorityVerdict,
        explanation: majorityResults[0].explanation,
        sources: majorityResults.map((r) => r.url),
        confidenceScore: Math.min(100, majorityResults.length * 10 + 50),
      };
    }

    if (googleResult?.claims?.length > 0) {
      const claim = googleResult.claims[0];
      return {
        verdict: claim.claimReview[0].textualRating.toLowerCase(),
        explanation: claim.claimReview[0].title,
        sources: [claim.claimReview[0].url],
        confidenceScore: 80,
      };
    }

    return {
      verdict: "unverifiable",
      explanation: "Could not verify this claim with available sources",
      sources: [],
      confidenceScore: 0,
    };
  }

  generateClaimHash(text) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(text).digest("hex");
  }
}

module.exports = new FactCheckService();
