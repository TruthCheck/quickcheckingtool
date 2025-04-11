const mongoose = require('mongoose');
const Verification = require('../models/verification.model');
const Claim = require('../models/claim.model');
const { ErrorResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');

class VerificationService {
  // Create a new verification
  async createVerification(verificationData, verifierId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Add verifier ID to verification data if human verification
      if (verificationData.verificationMethod === 'human' && verifierId) {
        verificationData.verifiedBy = verifierId;
      }

      // Check if claim exists
      const claim = await Claim.findById(verificationData.claimId).session(session);
      if (!claim) {
        throw new ErrorResponse(`Claim not found with id of ${verificationData.claimId}`, 404);
      }

      // Check if claim is already verified
      const existingVerification = await Verification.findOne({ 
        claimId: verificationData.claimId 
      }).session(session);
      
      if (existingVerification) {
        throw new ErrorResponse(`Claim already verified with id of ${verificationData.claimId}`, 400);
      }

      // Set default metadata if not provided
      verificationData.metadata = {
        systemVersion: process.env.SYSTEM_VERSION || '1.0.0',
        processingTime: 0,
        toolsUsed: [],
        ...verificationData.metadata
      };

      // Create verification
      const verification = await Verification.create([verificationData], { session });
      
      // Update claim status
      await Claim.findByIdAndUpdate(
        verificationData.claimId, 
        { 
          status: verificationData.verdict === 'unverifiable' ? 'unverifiable' : 'verified',
          lastVerifiedAt: new Date()
        },
        { session }
      );

      await session.commitTransaction();
      logger.info(`Verification created for claim ${verificationData.claimId}`);
      
      return verification[0];
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Verification creation failed: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get a verification by ID with optional population
  async getVerificationById(id, options = {}) {
    const { populate = true, lean = false } = options;
    
    let query = Verification.findById(id);
    
    if (populate) {
      query = query.populate('claimId', 'content author sourceUrl')
                  .populate('verifiedBy', 'name email role')
                  .populate('reviewedBy', 'name email role');
    }
    
    if (lean) {
      query = query.lean();
    }
    
    const verification = await query;
    
    if (!verification) {
      throw new ErrorResponse(`Verification not found with id of ${id}`, 404);
    }
    
    return verification;
  }

  // Update a verification with permission checks
  async updateVerification(id, updateData, userId, isAdmin = false) {
    const verification = await this.getVerificationById(id, { populate: false });
    
    // Check permission
    if (
      verification.verifiedBy && 
      verification.verifiedBy.toString() !== userId && 
      !isAdmin
    ) {
      throw new ErrorResponse(`Not authorized to update this verification`, 403);
    }
    
    // Don't allow updating certain fields
    const restrictedFields = ['verificationMethod', 'claimId', 'verifiedBy'];
    restrictedFields.forEach(field => delete updateData[field]);
    
    // If updating verdict, ensure confidence score is also provided
    if (updateData.verdict && !updateData.confidenceScore) {
      throw new ErrorResponse('Confidence score required when updating verdict', 400);
    }
    
    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('claimId', 'content');
    
    logger.info(`Verification ${id} updated by user ${userId}`);
    return updatedVerification;
  }

  // Delete a verification (admin only)
  async deleteVerification(id, userId) {
    const verification = await Verification.findByIdAndDelete(id);
    
    if (!verification) {
      throw new ErrorResponse(`Verification not found with id of ${id}`, 404);
    }
    
    logger.info(`Verification ${id} deleted by user ${userId}`);
    return verification;
  }

  // Dispute a verification
  async disputeVerification(id, reason, userId) {
    if (!reason || reason.length < 10) {
      throw new ErrorResponse('Please provide a valid reason for the dispute (min 10 chars)', 400);
    }
    
    const verification = await this.getVerificationById(id, { populate: false });
    
    if (verification.isDisputed) {
      throw new ErrorResponse('This verification is already disputed', 400);
    }
    
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
    
    logger.info(`Verification ${id} disputed by user ${userId}`);
    return updatedVerification;
  }

  // Review a disputed verification (admin only)
  async reviewDispute(id, status, reviewerId) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new ErrorResponse('Invalid review status. Must be "approved" or "rejected"', 400);
    }
    
    const verification = await this.getVerificationById(id, { populate: false });
    
    if (!verification.isDisputed) {
      throw new ErrorResponse('This verification is not disputed', 400);
    }
    
    const update = {
      reviewStatus: status,
      reviewedBy: reviewerId
    };
    
    if (status === 'approved') {
      update.isDisputed = false;
      update.disputeReason = null;
    }
    
    const updatedVerification = await Verification.findByIdAndUpdate(
      id,
      update,
      {
        new: true,
        runValidators: true
      }
    );
    
    logger.info(`Dispute for verification ${id} reviewed by ${reviewerId} with status ${status}`);
    return updatedVerification;
  }

  // Get verifications by claim ID with pagination and filtering
  async getVerificationsByClaim(claimId, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      method, 
      verdict, 
      disputed, 
      reviewed 
    } = options;
    
    // Check if claim exists
    const claimExists = await Claim.exists({ _id: claimId });
    if (!claimExists) {
      throw new ErrorResponse(`Claim not found with id of ${claimId}`, 404);
    }
    
    const query = { claimId };
    
    if (method) query.verificationMethod = method;
    if (verdict) query.verdict = verdict;
    if (disputed !== undefined) query.isDisputed = disputed;
    if (reviewed !== undefined) {
      query.reviewStatus = reviewed ? { $ne: 'pending' } : 'pending';
    }
    
    const verifications = await Verification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('verifiedBy', 'name')
      .lean();
    
    const total = await Verification.countDocuments(query);
    
    return {
      verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get high confidence verifications with pagination
  async getHighConfidenceVerifications(minConfidence = 0.8, page = 1, limit = 10) {
    try {
      const verifications = await Verification.find({
        confidenceScore: { $gte: minConfidence }
      })
      .sort({ confidenceScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('claimId', 'content');
      
      const total = await Verification.countDocuments({
        confidenceScore: { $gte: minConfidence }
      });
      
      return {
        verifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Failed to fetch high confidence verifications: ${error.message}`);
      throw new ErrorResponse(`Failed to fetch high confidence verifications: ${error.message}`, 500);
    }
  }

  // Get verification statistics
  async getVerificationStats() {
    try {
      const [verdictStats, methodStats, verifierStats] = await Promise.all([
        Verification.aggregate([
          { $group: { _id: '$verdict', count: { $sum: 1 }, avgConfidence: { $avg: '$confidenceScore' } } }
        ]),
        Verification.aggregate([
          { $group: { _id: '$verificationMethod', count: { $sum: 1 } } }
        ]),
        Verification.aggregate([
          { $match: { verificationMethod: 'human' } },
          { $group: { _id: '$verifiedBy', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { 'user.name': 1, 'user.email': 1, count: 1 } }
        ])
      ]);
      
      return { verdictStats, methodStats, verifierStats };
    } catch (error) {
      logger.error(`Failed to fetch verification statistics: ${error.message}`);
      throw new ErrorResponse('Failed to fetch verification statistics', 500);
    }
  }

  // Get recent verifications with pagination
  async getRecentVerifications(limit = 10, page = 1) {
    const verifications = await Verification.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('claimId', 'content')
      .populate('verifiedBy', 'name');
    
    const total = await Verification.countDocuments();
    
    return {
      verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new VerificationService();