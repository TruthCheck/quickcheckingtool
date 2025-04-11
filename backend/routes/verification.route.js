const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controllers');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

router.route('/')
  .get(
    (req, res, next) => {
      logger.info(`Fetching verifications with query: ${JSON.stringify(req.query)}`);
      next();
    },
    verificationController.getAllVerifications
  )
  .post(
    protect,
    authorize('verifier', 'admin'),
    verificationController.createVerification
  );

router.route('/stats')
  .get(
    protect,
    authorize('admin'),
    verificationController.getVerificationStats
  );

router.route('/recent')
  .get(verificationController.getRecentVerifications);

router.route('/high-confidence')
  .get(verificationController.getHighConfidenceVerifications);


router.route('/claim/:claimId')
  .get(verificationController.getVerificationsByClaim);

router.route('/:id')
  .get(verificationController.getVerification)
  .put(
    protect,
    authorize('verifier', 'admin'),
    verificationController.updateVerification
  )
  .delete(
    protect,
    authorize('admin'),
    verificationController.deleteVerification
  )

router.route('/:id/dispute')
  .put(
    protect,
    verificationController.disputeVerification
  );

router.route('/:id/review')
  .put(
    protect,
    authorize('admin'),
    verificationController.reviewDispute
  );

router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;