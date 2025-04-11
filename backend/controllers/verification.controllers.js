const verificationService = require('../services/verification.service');
const { ErrorResponse } = require('../utils/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');

// Create a new verification
exports.createVerification = asyncHandler(async (req, res, next) => {
  // Extract verifier ID from headers or request object if available
  const verifierId = req.headers['x-verifier-id'] || null;
  
  const verification = await verificationService.createVerification(req.body, verifierId);

  res.status(201).json({
    success: true,
    data: verification
  });
});

// Get all verifications
exports.getAllVerifications = asyncHandler(async (req, res, next) => {
    const verifications = await verificationService.getRecentVerifications(100); 
  
    res.status(200).json({
      success: true,
      count: verifications.length,
      data: verifications
    });
  });
  

// Get single verification

exports.getVerification = asyncHandler(async (req, res, next) => {
  const verification = await verificationService.getVerificationById(req.params.id);

  res.status(200).json({
    success: true,
    data: verification
  });
});

// Update verification
exports.updateVerification = asyncHandler(async (req, res, next) => {
  const verifierId = req.headers['x-verifier-id'] || null;
  const isAdmin = req.headers['x-is-admin'] === 'true' || false;
  
  const verification = await verificationService.updateVerification(
    req.params.id,
    req.body,
    verifierId,
    isAdmin
  );

  res.status(200).json({
    success: true,
    data: verification
  });
});

// Delete verification
exports.deleteVerification = asyncHandler(async (req, res, next) => {
  
  const isAdmin = req.headers['x-is-admin'] === 'true' || false;
  
  await verificationService.deleteVerification(req.params.id, isAdmin);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Dispute a verification
exports.disputeVerification = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new ErrorResponse('Please provide a reason for the dispute', 400));
  }

  const verification = await verificationService.disputeVerification(req.params.id, reason);

  res.status(200).json({
    success: true,
    data: verification
  });
});

// Review a disputed verification
exports.reviewDispute = asyncHandler(async (req, res, next) => {
  const { status, reviewerId } = req.body;
  const isAdmin = req.headers['x-is-admin'] === 'true' || false;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid review status', 400));
  }

  if (!reviewerId) {
    return next(new ErrorResponse('Please provide a reviewer ID', 400));
  }

  const verification = await verificationService.reviewDispute(
    req.params.id,
    status,
    reviewerId,
    isAdmin
  );

  res.status(200).json({
    success: true,
    data: verification
  });
});

// Get verifications by claim
exports.getVerificationsByClaim = asyncHandler(async (req, res, next) => {
  const verifications = await verificationService.getVerificationsByClaim(req.params.claimId);

  res.status(200).json({
    success: true,
    count: verifications.length,
    data: verifications
  });
});

// Get verification statistics
exports.getVerificationStats = asyncHandler(async (req, res, next) => {
  const stats = await verificationService.getVerificationStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Get high confidence verifications
exports.getHighConfidenceVerifications = asyncHandler(async (req, res, next) => {
  const minConfidence = parseFloat(req.query.min) || 0.8;
  
  const verifications = await verificationService.getHighConfidenceVerifications(minConfidence);

  res.status(200).json({
    success: true,
    count: verifications.length,
    data: verifications
  });
});

// Get recent verifications
exports.getRecentVerifications = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const verifications = await verificationService.getRecentVerifications(limit);

  res.status(200).json({
    success: true,
    count: verifications.length,
    data: verifications
  });
});