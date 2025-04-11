const express = require("express");
const router = express.Router();
// const { auth } = require("../middlewares/auth");
const Claim = require("../models/claim.model");
const Verification = require("../models/verification.model");
const factCheckService = require("../services/factCheck.service");
const translationService = require("../services/translation.service");
const logger = require("../utils/logger.js");

router.get("/test", async (req, res) => {
  try {
    logger.info("Testing fact check service...");
    const testVerification = await factCheckService.verifyClaim(
      "Test claim - vaccines are safe",
      "health",
      "en"
    );

    successResponse(res, 200, {
      message: "Test successful",
      result: testVerification,
    });
  } catch (error) {
    logger.error("Test route error:", error);
    errorResponse(res, 500, "Test failed", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { text, category, image, language = "en" } = req.body;
    const userId = req.user._id;

    const claim = new Claim({
      originalText: text,
      category,
      submittedBy: userId,
      status: "pending",
    });

    if (image) {
      claim.imageHash = "image_hash_placeholder";
    }

    await claim.save();

    const verification = await factCheckService.verifyClaim(
      text,
      category,
      language
    );

    const verificationDoc = new Verification({
      claimId: claim._id,
      verdict: verification.verdict,
      explanation: verification.explanation,
      sources: verification.sources,
      confidenceScore: verification.confidenceScore,
      verifiedBy: userId,
    });

    await verificationDoc.save();

    claim.status =
      verification.verdict === "unverifiable" ? "pending" : "verified";
    await claim.save();

    return res.status(201).json({
      success: true,
      requestId: claim._id,
      status: claim.status,
      verification: verification,
    });
  } catch (error) {
    logger.error("Submit claim error:", error);
    return res.status(500).json({ error: "Failed to process claim" });
  }
});

router.get("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { language = "en" } = req.query;

    const claim = await Claim.findById(requestId);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    const verification = await Verification.findOne({ claimId: claim._id });
    if (!verification) {
      return res.json({
        success: true,
        status: claim.status,
        message: "Verification in progress",
      });
    }

    let explanation = verification.explanation;
    if (language !== "en") {
      explanation = await translationService.translateVerification(
        verification._id,
        language
      );
    }

    return res.json({
      success: true,
      status: claim.status,
      verdict: verification.verdict,
      explanation,
      sources: verification.sources,
      confidence: verification.confidenceScore,
      timestamp: verification.verificationDate,
      expires: verification.expirationDate,
    });
  } catch (error) {
    logger.error("Get claim result error:", error);
    return res.status(500).json({ error: "Failed to retrieve claim result" });
  }
});

module.exports = router;
