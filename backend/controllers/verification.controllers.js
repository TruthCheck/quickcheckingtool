const verificationService = require('../services/verification.service');
const { ErrorResponse, SuccessResponse } = require('../utils/responseHandlers');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

// Helper function to parse auth headers
const parseAuthHeaders = (req) => ({
  verifierId: req.user?.id || req.headers['x-verifier-id'] || null,
  isAdmin: req.user?.isAdmin || req.headers['x-is-admin'] === 'true' || false,
  reviewerId: req.user?.id || req.headers['x-reviewer-id'] || null
});

// Create a new verification
exports.createVerification = asyncHandler(async (req, res, next) => {
  const { verifierId } = parseAuthHeaders(req);
  
  logger.info('Verification creation initiated', { 
    body: req.body,
    verifierId 
  });

  const verification = await verificationService.createVerification(
    req.body, 
    verifierId
  );

  logger.info('Verification created successfully', { 
    verificationId: verification._id 
  });

  new SuccessResponse(
    'Verification created successfully',
    verification,
    201
  ).send(res);
});

// Get all verifications with pagination
exports.getAllVerifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  
  const { verifications, pagination } = await verificationService.getRecentVerifications(
    limit,
    page
  );

  new SuccessResponse(
    'Verifications retrieved successfully',
    verifications,
    200,
    pagination
  ).send(res);
});

// Get single verification

exports.getVerification = asyncHandler(async (req, res, next) => {
  const verification = await verificationService.getVerificationById(
    req.params.id,
    { populate: true }
  );

  new SuccessResponse(
    'Verification retrieved successfully',
    verification
  ).send(res);
});

// Update verification

exports.updateVerification = asyncHandler(async (req, res, next) => {
  const { verifierId, isAdmin } = parseAuthHeaders(req);
  
  logger.info('Verification update initiated', {
    verificationId: req.params.id,
    updates: req.body,
    verifierId
  });

  const verification = await verificationService.updateVerification(
    req.params.id,
    req.body,
    verifierId,
    isAdmin
  );

  logger.info('Verification updated successfully', {
    verificationId: verification._id
  });

  new SuccessResponse(
    'Verification updated successfully',
    verification
  ).send(res);
});

// Delete verification

exports.deleteVerification = asyncHandler(async (req, res, next) => {
  const { isAdmin } = parseAuthHeaders(req);
  
  logger.warn('Verification deletion requested', {
    verificationId: req.params.id,
    isAdmin
  });

  await verificationService.deleteVerification(
    req.params.id, 
    isAdmin
  );

  logger.warn('Verification deleted successfully', {
    verificationId: req.params.id
  });

  new SuccessResponse(
    'Verification deleted successfully',
    {}
  ).send(res);
});

// Dispute a verification

exports.disputeVerification = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason || reason.length < 10) {
    return next(new ErrorResponse(
      'Please provide a valid reason for the dispute (min 10 chars)',
      400
    ));
  }

  const { verifierId } = parseAuthHeaders(req);

  logger.info('Verification dispute initiated', {
    verificationId: req.params.id,
    reason: reason.substring(0, 100) + (reason.length > 100 ? '...' : ''),
    verifierId
  });

  const verification = await verificationService.disputeVerification(
    req.params.id,
    reason,
    verifierId
  );

  logger.info('Verification disputed successfully', {
    verificationId: verification._id
  });

  new SuccessResponse(
    'Verification disputed successfully',
    verification
  ).send(res);
});

// Review a disputed verification

exports.reviewDispute = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const { reviewerId, isAdmin } = parseAuthHeaders(req);
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse(
      'Invalid review status. Must be "approved" or "rejected"',
      400
    ));
  }

  logger.info('Dispute review initiated', {
    verificationId: req.params.id,
    status,
    reviewerId
  });

  const verification = await verificationService.reviewDispute(
    req.params.id,
    status,
    reviewerId,
    isAdmin
  );

  logger.info('Dispute reviewed successfully', {
    verificationId: verification._id,
    status
  });

  new SuccessResponse(
    'Dispute reviewed successfully',
    verification
  ).send(res);
});

// Get verifications by claim ID
exports.getVerificationsByClaim = asyncHandler(async (req, res, next) => {
  const { verifications, pagination } = await verificationService.getVerificationsByClaim(
    req.params.claimId,
    {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      method: req.query.method,
      verdict: req.query.verdict,
      disputed: req.query.disputed ? req.query.disputed === 'true' : undefined,
      reviewed: req.query.reviewed ? req.query.reviewed === 'true' : undefined
    }
  );

  new SuccessResponse(
    'Verifications retrieved successfully',
    verifications,
    200,
    pagination
  ).send(res);
});

//Get verification statistics
exports.getVerificationStats = asyncHandler(async (req, res, next) => {
  const stats = await verificationService.getVerificationStats();

  new SuccessResponse(
    'Verification statistics retrieved successfully',
    stats
  ).send(res);
});

//Get high confidence verifications
exports.getHighConfidenceVerifications = asyncHandler(async (req, res, next) => {
  const minConfidence = parseFloat(req.query.min) || 0.8;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const { verifications, pagination } = await verificationService.getHighConfidenceVerifications(
    minConfidence,
    page,
    limit
  );

  new SuccessResponse(
    'High confidence verifications retrieved successfully',
    verifications,
    200,
    pagination
  ).send(res);
});

//Get recent verifications

exports.getRecentVerifications = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  
  const { verifications, pagination } = await verificationService.getRecentVerifications(
    limit,
    page
  );

  new SuccessResponse(
    'Recent verifications retrieved successfully',
    verifications,
    200,
    pagination
  ).send(res);
});