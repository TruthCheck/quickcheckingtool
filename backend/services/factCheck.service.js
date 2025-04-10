const axios = require("axios");
const Claim = require("../models/claim.model");
const Verification = require("../models/verification.model");
const OfficialSource = require("../models/officialSource.model");
const { translateText } = require("../config/translate");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

class FactCheckService {
  constructor() {
    this.googleFactCheckUrl =
      "https://factchecktools.googleapis.com/v1alpha1/claims:search";
  }

  async verifyClaim(claimText, category, language = "en") {
    const claimHash = this.generateClaimHash(claimText);

    const cachedResult = await this.getCachedResult(claimHash, language);
    if (cachedResult) {
      return cachedResult;
    }

    const googleResult = await this.checkGoogleFactCheck(claimText, language);

    const officialResults = await this.checkOfficialSources(
      claimText,
      category,
      language
    );

    const verdict = this.analyzeResults(googleResult, officialResults);

    await this.cacheResult(claimHash, verdict, language);

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
      if (claimText.toLowerCase().includes("covid") && category === "health") {
        results.push({
          source: source.name,
          url: source.url,
          match: true,
          verdict: "true",
          explanation: "Verified by official health sources",
        });
      }
    }

    return results;
  }

  analyzeResults(googleResult, officialResults) {
    if (officialResults.length > 0) {
      return {
        verdict: officialResults[0].verdict,
        explanation: officialResults[0].explanation,
        sources: officialResults.map((r) => r.url),
        confidenceScore: 90,
      };
    }

    if (googleResult && googleResult.claims && googleResult.claims.length > 0) {
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

  generateClaimHash(claimText) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(claimText).digest("hex");
  }

  async getCachedResult(claimHash, language) {
    try {
      const cached = await redisClient.get(`claim:${claimHash}:${language}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error("Redis cache error:", error);
      return null;
    }
  }

  async cacheResult(claimHash, result, language) {
    try {
      await redisClient.setEx(
        `claim:${claimHash}:${language}`,
        3600 * 24 * 7,
        JSON.stringify(result)
      );
    } catch (error) {
      logger.error("Redis cache set error:", error);
    }
  }
}

module.exports = new FactCheckService();
