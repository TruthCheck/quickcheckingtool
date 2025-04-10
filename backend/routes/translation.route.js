const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const Claim = require("../models/claim.model");
const Verification = require("../models/verification.model");
const translationService = require("../services/translation.service");
const logger = require("../utils/logger");


router.post("/contribute", auth, async (req, res) => {
  try {
    const {
      originalText,
      originalLanguage,
      translatedText,
      targetLanguage,
      context,
    } = req.body;

    return res.json({
      success: true,
      message: "Translation submitted for review",
      translationId: new mongoose.Types.ObjectId(),
    });
  } catch (error) {
    logger.error("Translation contribution error:", error);
    return res.status(500).json({ error: "Failed to submit translation" });
  }
});


router.post("/", auth, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    const translatedText = await translationService.translateText(
      text,
      targetLanguage,
      "en" 
    );

    return res.json({
      success: true,
      translatedText,
    });
  } catch (error) {
    logger.error("Translation error:", error);
    return res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
