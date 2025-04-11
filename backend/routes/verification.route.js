// routes/verificationRoutes.js
const express = require('express');
const verificationController = require('../controllers/verification.controllers');

const router = express.Router();

// Base route: /api/verifications

router
  .route('/')
  .get(verificationController.getAllVerifications) 
  .post(verificationController.createVerification);

router
  .route('/stats')
  .get(verificationController.getVerificationStats);

router
  .route('/recent')
  .get(verificationController.getRecentVerifications);

router
  .route('/high-confidence')
  .get(verificationController.getHighConfidenceVerifications);

router
  .route('/claim/:claimId')
  .get(verificationController.getVerificationsByClaim);

router
  .route('/:id')
  .get(verificationController.getVerification)
  .put(verificationController.updateVerification)
  .delete(verificationController.deleteVerification);

router
  .route('/:id/dispute')
  .put(verificationController.disputeVerification);

router
  .route('/:id/review')
  .put(verificationController.reviewDispute);

module.exports = router;
