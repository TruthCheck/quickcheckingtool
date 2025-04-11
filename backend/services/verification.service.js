
const mongoose = require("mongoose");
const Verification = require("../models/verification.model");
const Claim = require("../models/claim.model");
const { ErrorResponse } = require("../utils/errorHandler");


class VerificationService {
  async createVerification(verificationData, verifierId = null) {

    if (verificationData.verificationMethod === "human" && verifierId) {
      verificationData.verifiedBy = verifierId;
    }

    const claim = await Claim.findById(verificationData.claimId);
    if (!claim) {
      throw new ErrorResponse(
        `Claim not found with id of ${verificationData.claimId}`,
        404
      );
    }

    const existingVerification = await Verification.findOne({
      claimId: verificationData.claimId,
    });
    if (existingVerification) {
      throw new ErrorResponse(
        `Claim already verified with id of ${verificationData.claimId}`,
        400
      );
    }

    if (!verificationData.metadata) {
      verificationData.metadata = {
        systemVersion: process.env.SYSTEM_VERSION || "1.0.0",
        processingTime: 0,
        toolsUsed: [],
      };


    return await Verification.create({
      claimId: claim._id,
      verificationMethod: verificationData.verificationMethod || "automated",
      verdict: verificationData.verdict || "unverifiable",
      confidenceScore: verificationData.confidenceScore || 0,
      explanation:
        verificationData.explanation || "Initial verification pending",
      sources: verificationData.sources || [],
      metadata: {
        processingTime: verificationData.metadata?.processingTime || 0,
        toolsUsed: verificationData.metadata?.toolsUsed || [],
        systemVersion: verificationData.metadata?.systemVersion || "1.0.0",
      },
    });

    // return Verification;
  }

  // Get a verification by ID with optional population
  async getVerificationById(id, options = {}) {
    const { populate = true, lean = false } = options;
    
    let query = Verification.findById(id);


    if (withPopulate) {
      query = query.populate("claimId", "content author sourceUrl");

    }

    const verification = await query;

    if (!verification) {
      throw new ErrorResponse(`Verification not found with id of ${id}`, 404);
    }

    return verification;
  }


  async updateVerification(id, updateData, verifierId, isAdmin = false) {
    const verification = await this.getVerificationById(id, false);

    if (
      verification.verifiedBy &&
      verification.verifiedBy.toString() !== verifierId &&
      !isAdmin
    ) {
      throw new ErrorResponse(
        `Not authorized to update this verification`,
        401
      );
    }

    delete updateData.verificationMethod;
    delete updateData.claimId;
    delete updateData.verifiedBy;

    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }

    );

    return updatedVerification;
  }

  async deleteVerification(id, isAdmin = false) {
    const verification = await this.getVerificationById(id, false);

    // Check permission
    if (!isAdmin) {
      throw new ErrorResponse(
        `Not authorized to delete this verification`,
        401
      );
    }

    await verification.deleteOne();
  }

  async disputeVerification(id, reason) {
    if (!reason) {
      throw new ErrorResponse("Please provide a reason for the dispute", 400);
    }

    const verification = await this.getVerificationById(id, false);

    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      {
        isDisputed: true,
        disputeReason: reason,
        reviewStatus: "pending",
      },
      {
        new: true,
        runValidators: true,
      }
    );


    return updatedVerification;
  }

  async reviewDispute(id, status, reviewerId, isAdmin = false) {
    if (!status || !["approved", "rejected"].includes(status)) {
      throw new ErrorResponse("Please provide a valid review status", 400);
    }

    const verification = await this.getVerificationById(id, false);


    if (!verification.isDisputed) {
      throw new ErrorResponse("This verification is not disputed", 400);
    }


    if (!isAdmin) {
      throw new ErrorResponse(`Not authorized to review disputes`, 401);

    }

    const updatedVerification = await Verification.findByIdAndUpdate(
      id,

      {
        reviewStatus: status,
        reviewedBy: reviewerId,
      },

      {
        new: true,
        runValidators: true,
      }
    );


    return updatedVerification;
  }

  async getVerificationsByClaim(claimId) {

    // Check if claim exists
    const claimExists = await Claim.exists({ _id: claimId });
    if (!claimExists) {
      throw new ErrorResponse(`Claim not found with id of ${claimId}`, 404);
    }


    const verifications = await Verification.find({ claimId });

    return verifications;
  }

  async getHighConfidenceVerifications(minConfidence = 0.8) {
    try {
      return await Verification.find({
        confidenceScore: { $gte: minConfidence },
      }).sort({ confidenceScore: -1 });
    } catch (error) {
      throw new ErrorResponse(
        `Failed to fetch high confidence verifications: ${error.message}`,
        500
      );

    }
  }

  async getVerificationStats() {

    const verdictStats = await Verification.aggregate([
      {
        $group: {
          _id: "$verdict",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidenceScore" },
        },
      },
    ]);

    const methodStats = await Verification.aggregate([
      {
        $group: {
          _id: "$verificationMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    const verifierStats = await Verification.aggregate([
      {
        $match: { verificationMethod: "human" },
      },
      {
        $group: {
          _id: "$verifiedBy",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return {
      verdictStats,
      methodStats,
      verifierStats,
    };
  }

  async getRecentVerifications(limit = 10) {

    const verifications = await Verification.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

      .populate("claimId", "content");

    return verifications;

  }
}

module.exports = new VerificationService();
