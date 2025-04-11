const CachedResult = require("../models/cachedResult.model");
const Verification = require("../models/verification.model");
const OfficialSource = require("../models/officialSource.model");
const { generateClaimHash, generateImageHash } = require("../utils/hashing");
const logger = require("../utils/logger");
const axios = require("axios");

class FactCheckService {
  constructor() {
    this.baseUrl =
      "https://factchecktools.googleapis.com/v1alpha1/claims:search";
  }

  async verifyClaim(claimText, category, language = "en") {
    try {
      const claimHash = generateClaimHash(claimText);
      console.log(`Verifying claim: ${claimText.substring(0, 50)}...`);

      const cached = await CachedResult.findOne({ claimHash })
        .populate("verificationId")
        .lean();

      if (cached) {
        console.log("Returning cached result");
        return cached.verificationId;
      }

      const [googleResult, officialResults] = await Promise.all([
        this.checkGoogleFactCheck(claimText, language),
        this.checkOfficialSources(claimText, category, language),
      ]);

      const verdict = this.analyzeResults(googleResult, officialResults);
      verdict.verificationMethod = this.getVerificationMethod(
        googleResult,
        officialResults
      );

      console.log("Analysis complete:", verdict);

      const verificationDoc = await Verification.create(verdict);

      await CachedResult.updateOne(
        { claimHash },
        {
          verificationId: verificationDoc._id,
          lastAccessed: new Date(),
          $inc: { accessCount: 1 },
          $addToSet: { languagesAvailable: language },
        },
        { upsert: true }
      );

      return verificationDoc.toObject();
    } catch (error) {
      console.error("FactCheckService error:", error);
      throw new Error(`Fact-check failed: ${error.message}`);
    }
  }

  getVerificationMethod(googleResult, officialResults) {
    if (officialResults.length > 0 && googleResult?.claims?.length > 0) {
      return "combined";
    } else if (officialResults.length > 0) {
      return "official_sources";
    } else if (googleResult?.claims?.length > 0) {
      return "google_factcheck";
    } else {
      return "unverifiable";
    }
  }

  async checkGoogleFactCheck(claimText, language = "en") {
    try {
      const apiKey = process.env.GOOGLE_FACTCHECK_API_KEY;
      const baseUrl =
        "https://factchecktools.googleapis.com/v1alpha1/claims:search";

      const params = new URLSearchParams({
        query: claimText,
        languageCode: this.mapLanguageCode(language),
        key: apiKey,
      });

      const url = `${baseUrl}?${params.toString()}`;
      const response = await axios.get(url);

      return response.data;
    } catch (error) {
      logger.error(
        "Google FactCheck API error:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  mapLanguageCode(lang) {
    const mappings = {
      en: "en-US",
      ha: "ha-NG",
      yo: "yo-NG",
      ig: "ig-NG",
    };
    return mappings[lang] || "en-US";
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
        explanation:
          majorityResults[0]?.explanation || "Verified by official sources",
        sources: majorityResults.map((r) => r.url).filter(Boolean),
        confidenceScore: Math.min(100, majorityResults.length * 15 + 50),
      };
    }

    if (googleResult?.claims?.length > 0) {
      const mostRelevant = googleResult.claims[0].claimReview[0];
      return {
        verdict: mostRelevant.textualRating.toLowerCase(),
        explanation: mostRelevant.title || "Verified by fact-checkers",
        sources: [mostRelevant.url].filter(Boolean),
        confidenceScore: 70,
      };
    }

    return {
      verdict: "unverifiable",
      explanation: "Could not verify with available sources",
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
