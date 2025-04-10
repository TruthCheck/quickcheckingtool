const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const OfflineRequest = require("../models/offlineRequest.model");
const factCheckService = require("../services/factCheck.service");
const logger = require("../utils/logger");

router.post("/sync", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { pendingRequests } = req.body;

    const savedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const offlineReq = new OfflineRequest({
          userId,
          claimText: request.text,
          metadata: {
            location: request.location,
            timestamp: request.timestamp,
          },
          status: "pending",
        });

        if (request.image) {
          offlineReq.claimImage = Buffer.from(request.image, "base64");
        }

        await offlineReq.save();
        return offlineReq;
      })
    );

    const processedResults = [];
    for (const request of savedRequests) {
      try {
        const verification = await factCheckService.verifyClaim(
          request.claimText,
          "general",
          req.user.preferredLanguage || "en"
        );

        request.status = "processed";
        request.resultId = verification._id;
        await request.save();

        processedResults.push({
          localId: request.localId,
          requestId: request._id,
          status: "completed",
          verification,
        });
      } catch (error) {
        logger.error(`Error processing offline request ${request._id}:`, error);
        processedResults.push({
          localId: request.localId,
          requestId: request._id,
          status: "failed",
        });
      }
    }

    return res.json({
      success: true,
      processed: processedResults,
    });
  } catch (error) {
    logger.error("Sync offline requests error:", error);
    return res.status(500).json({ error: "Failed to sync offline requests" });
  }
});

module.exports = router;
