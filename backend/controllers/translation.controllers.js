const translationService = require("../services/translation.service");
const { successResponse, errorResponse } = require("../utils/response");
const { auth } = require("../middlewares/auth");
const logger = require("../utils/logger");

exports.translateText = [
  auth,
  async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage = "en" } = req.body;

      if (!text || !targetLanguage) {
        return errorResponse(res, 400, "Text and target language are required");
      }

      const translatedText = await translationService.translateText(
        text,
        targetLanguage,
        sourceLanguage
      );

      return successResponse(res, 200, {
        translatedText,
      });
    } catch (error) {
      logger.error("Translation error:", error);
      return errorResponse(res, 500, "Translation failed");
    }
  },
];

exports.contributeTranslation = [
  auth,
  async (req, res) => {
    try {
      const {
        originalText,
        translatedText,
        targetLanguage,
        sourceLanguage = "en",
        context,
      } = req.body;

      if (!originalText || !translatedText || !targetLanguage) {
        return errorResponse(
          res,
          400,
          "Original text, translated text and target language are required"
        );
      }


      return successResponse(res, 201, {
        message: "Translation submitted for review",
        translationId: new mongoose.Types.ObjectId(),
      });
    } catch (error) {
      logger.error("Translation contribution error:", error);
      return errorResponse(res, 500, "Failed to submit translation");
    }
  },
];
