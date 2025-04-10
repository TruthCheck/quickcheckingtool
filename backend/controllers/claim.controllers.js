const Claim = require("../models/claim.model");
const Verification = require("../models/verification.model");
const factCheckService = require("../services/factCheck.service");
const translationService = require("../services/translation.service");
const imageService = require("../services/image.service");
const { successResponse, errorResponse } = require("../utils/response");
const { auth, optionalAuth } = require("../middlewares/auth");
const { claimCacheMiddleware } = require("../middlewares/cache");
const logger = require("../utils/logger");

exports.submitClaim = [
  optionalAuth,
  claimCacheMiddleware,
  async (req, res) => {
    try {
      const { text, category, image, language = "en" } = req.body;
      const userId = req.user?._id;

      if (!text || !category) {
        return errorResponse(res, 400, "Text and category are required");
      }


      const claim = new Claim({
        originalText: text,
        category,
        submittedBy: userId,
        status: "pending",
      });

 
      if (image) {
        try {
          const imageBuffer = Buffer.from(image, "base64");
          claim.imageHash = imageService.generateImageHash(imageBuffer);
        } catch (error) {
          logger.error("Image processing error:", error);
          return errorResponse(res, 400, "Invalid image data");
        }
      }

      await claim.save();


      let verification;
      if (image) {
        const imageBuffer = Buffer.from(image, "base64");
        verification = await imageService.verifyImage(
          imageBuffer,
          category,
          language
        );
      } else {
        verification = await factCheckService.verifyClaim(
          text,
          category,
          language
        );
      }

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

      return successResponse(res, 201, {
        requestId: claim._id,
        status: claim.status,
        verification: {
          verdict: verification.verdict,
          explanation: verification.explanation,
          sources: verification.sources,
          confidence: verification.confidenceScore,
        },
      });
    } catch (error) {
      logger.error("Submit claim error:", error);
      return errorResponse(res, 500, "Failed to process claim");
    }
  },
];

exports.getClaimResult = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { language = "en" } = req.query;

    const claim = await Claim.findById(requestId);
    if (!claim) {
      return errorResponse(res, 404, "Claim not found");
    }

    const verification = await Verification.findOne({ claimId: claim._id });
    if (!verification) {
      return successResponse(res, 200, {
        status: claim.status,
        message: "Verification in progress",
      });
    }


    let explanation = verification.explanation;
    if (language !== "en") {
      try {
        explanation = await translationService.translateVerification(
          verification._id,
          language
        );
      } catch (error) {
        logger.error("Translation error:", error);
      }
    }

    return successResponse(res, 200, {
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
    return errorResponse(res, 500, "Failed to retrieve claim result");
  }
};
