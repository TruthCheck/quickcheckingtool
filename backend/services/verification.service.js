const mongoose = require('mongoose');
const Verification = require('../models/verification.model');
const Claim = require('../models/claim.model');
const { ErrorResponse } = require('../utils/errorHandler');

class VerificationService {
  // Create a new verification
  async createVerification(verificationData, verifierId = null) {
    // Add verifier ID to verification data if human verification
    if (verificationData.verificationMethod === 'human' && verifierId) {
      verificationData.verifiedBy = verifierId;
    }

    // Check if claim exists
    const claim = await Claim.findById(verificationData.claimId);
    if (!claim) {
      throw new ErrorResponse(`Claim not found with id of ${verificationData.claimId}`, 404);
    }

    // Check if claim is already verified
    const existingVerification = await Verification.findOne({ claimId: verificationData.claimId });
    if (existingVerification) {
      throw new ErrorResponse(`Claim already verified with id of ${verificationData.claimId}`, 400);
    }

    // Set default metadata if not provided
    if (!verificationData.metadata) {
      verificationData.metadata = {
        systemVersion: process.env.SYSTEM_VERSION || '1.0.0',
        processingTime: 0,
        toolsUsed: []
      };
    }

    // Create verification
    const verification = await Verification.create(verificationData);
    return verification;
  }

  // Get a verification by ID
  async getVerificationById(id, withPopulate = true) {
    let query = Verification.findById(id);
    
    if (withPopulate) {
      query = query.populate('claimId', 'content author sourceUrl');
    }
    
    const verification = await query;
    
    if (!verification) {
      throw new ErrorResponse(`Verification not found with id of ${id}`, 404);
    }
    
    return verification;
  }

  // Update a verification
  async updateVerification(id, updateData, verifierId, isAdmin = false) {
    const verification = await this.getVerificationById(id, false);
    
    // Check permission
    if (
      verification.verifiedBy && 
      verification.verifiedBy.toString() !== verifierId && 
      !isAdmin
    ) {
      throw new ErrorResponse(`Not authorized to update this verification`, 401);
    }
    
    // Don't allow updating certain fields
    delete updateData.verificationMethod;
    delete updateData.claimId;
    delete updateData.verifiedBy;
    
    // Update verification
    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    return updatedVerification;
  }

  // Delete a verification
  async deleteVerification(id, isAdmin = false) {
    const verification = await this.getVerificationById(id, false);
    
    // Check permission
    if (!isAdmin) {
      throw new ErrorResponse(`Not authorized to delete this verification`, 401);
    }
    
    await verification.deleteOne();
  }

  // Dispute a verification
  async disputeVerification(id, reason) {
    if (!reason) {
      throw new ErrorResponse('Please provide a reason for the dispute', 400);
    }
    
    const verification = await this.getVerificationById(id, false);
    
    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      {
        isDisputed: true,
        disputeReason: reason,
        reviewStatus: 'pending'
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    return updatedVerification;
  }

  // Review a disputed verification
  async reviewDispute(id, status, reviewerId, isAdmin = false) {
    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new ErrorResponse('Please provide a valid review status', 400);
    }
    
    const verification = await this.getVerificationById(id, false);
    
    if (!verification.isDisputed) {
      throw new ErrorResponse('This verification is not disputed', 400);
    }
    
    // Check permission
    if (!isAdmin) {
      throw new ErrorResponse(`Not authorized to review disputes`, 401);
    }
    
    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      {
        reviewStatus: status,
        reviewedBy: reviewerId
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    return updatedVerification;
  }

  // Get verifications by claim ID
  async getVerificationsByClaim(claimId) {
    // Check if claim exists
    const claim = await Claim.findById(claimId);
    if (!claim) {
      throw new ErrorResponse(`Claim not found with id of ${claimId}`, 404);
    }
    
    const verifications = await Verification.find({ claimId });
    
    return verifications;
  }

  // Get high confidence verifications
  async getHighConfidenceVerifications(minConfidence = 0.8) {
    try {
      return await Verification.find({
        confidenceScore: { $gte: minConfidence }
      }).sort({ confidenceScore: -1 });
    } catch (error) {
      throw new ErrorResponse(`Failed to fetch high confidence verifications: ${error.message}`, 500);
    }
  }

  // Get verification statistics
  async getVerificationStats() {
    const verdictStats = await Verification.aggregate([
      {
        $group: {
          _id: '$verdict',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidenceScore' }
        }
      }
    ]);
    
    const methodStats = await Verification.aggregate([
      {
        $group: {
          _id: '$verificationMethod',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const verifierStats = await Verification.aggregate([
      {
        $match: { verificationMethod: 'human' }
      },
      {
        $group: {
          _id: '$verifiedBy',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    return {
      verdictStats,
      methodStats,
      verifierStats
    };
  }

  // Get recent verifications
  async getRecentVerifications(limit = 10) {
    const verifications = await Verification.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('claimId', 'content');
    
    return verifications;
  }
}

module.exports = new VerificationService();