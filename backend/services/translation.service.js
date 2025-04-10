const Claim = require("../models/claim.model");
const Verification = require("../models/verification.model");
const { translateText } = require("../config/translate");
const logger = require("../utils/logger");

class TranslationService {
  async translateClaim(claimId, targetLanguage) {
    try {
      const claim = await Claim.findById(claimId);
      if (!claim) throw new Error("Claim not found");

      const existing = claim.translatedTexts.find(
        (t) => t.language === targetLanguage
      );
      if (existing) return existing.text;

      const translated = await translateText(
        claim.originalText,
        targetLanguage
      );

      claim.translatedTexts.push({
        language: targetLanguage,
        text: translated,
      });
      await claim.save();

      return translated;
    } catch (error) {
      logger.error("Claim translation error:", error);
      throw error;
    }
  }

  async translateVerification(verificationId, targetLanguage) {
    try {
      const verification = await Verification.findById(verificationId);
      if (!verification) throw new Error("Verification not found");

      const existing = verification.translatedExplanations.find(
        (t) => t.language === targetLanguage
      );
      if (existing) return existing.text;

      const translated = await translateText(
        verification.explanation,
        targetLanguage
      );

      verification.translatedExplanations.push({
        language: targetLanguage,
        text: translated,
      });
      await verification.save();

      return translated;
    } catch (error) {
      logger.error("Verification translation error:", error);
      throw error;
    }
  }

  async translateText(text, targetLanguage, sourceLanguage = "en") {
    try {
      return await translateText(text, targetLanguage, sourceLanguage);
    } catch (error) {
      logger.error("Text translation error:", error);
      throw error;
    }
  }
}

module.exports = new TranslationService();
