const axios = require("axios");
const { createHash } = require("crypto");
const Claim = require("../models/claim.model");
const logger = require("../utils/logger");

class ImageService {
  async verifyImage(imageBuffer, category, language = "en") {
    try {
      const imageHash = this.generateImageHash(imageBuffer);

      const existingClaim = await Claim.findOne({
        imageHash,
        category,
      }).populate("verifications");

      if (existingClaim && existingClaim.verifications.length > 0) {
        const verification = existingClaim.verifications[0];
        return {
          verdict: verification.verdict,
          explanation: verification.explanation,
          sources: verification.sources,
          confidenceScore: verification.confidenceScore,
        };
      }


      const reverseSearchResults = await this.reverseImageSearch(imageBuffer);


      return this.analyzeImageResults(reverseSearchResults);
    } catch (error) {
      logger.error("Image verification error:", error);
      throw error;
    }
  }

  generateImageHash(buffer) {
    return createHash("sha256").update(buffer).digest("hex");
  }

  async reverseImageSearch(imageBuffer) {


    return {
      matches: [
        {
          url: "https://example.com/factchecked-image",
          title: "Verified official document",
          source: "NCDC",
          date: "2023-01-15",
        },
      ],
    };
  }

  analyzeImageResults(results) {
    if (results.matches.length === 0) {
      return {
        verdict: "unverifiable",
        explanation: "No matches found for this image",
        sources: [],
        confidenceScore: 0,
      };
    }

  
    const officialMatches = results.matches.filter(
      (m) => m.source && ["NCDC", "INEC", "Government"].includes(m.source)
    );

    if (officialMatches.length > 0) {
      return {
        verdict: "true",
        explanation: "Image matches official records",
        sources: officialMatches.map((m) => m.url),
        confidenceScore: 90,
      };
    }

    return {
      verdict: "unverifiable",
      explanation: "Image found but not from official sources",
      sources: results.matches.map((m) => m.url),
      confidenceScore: 40,
    };
  }
}

module.exports = new ImageService();
