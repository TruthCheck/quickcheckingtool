const mongoose = require('mongoose');
const { ErrorResponse } = require('../utils/errorHandler');

const verificationSchema = new mongoose.Schema({
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Claim",
    required: [true, 'Method is required'],
    enum: ['automated', 'human', 'partner', 'official']
  },
  verdict: {
    type: String,
    required: [true, 'Verdict is required'],
    enum: ['true', 'false', 'misleading', 'unverifiable']
  },
  confidenceScore: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be less than 0'],
    max: [1, 'Confidence cannot exceed 1']
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    minlength: [20, 'Explanation must be at least 20 characters']
  },
  sources: [{
    name: String,
    url: {
      type: String,
      validate: {
        validator: function(v) {
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      }
    },
    type: {
      type: String,
      enum: ['official', 'news', 'expert', 'other']
    }
  }],
  metadata: {
    processingTime: Number,
    toolsUsed: [String],
    systemVersion: String
  },
  isDisputed: {
    type: Boolean,
    default: false
  },
  disputeReason: String,
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validate that human verifications have user references
verificationSchema.pre('save', function(next) {
  if (this.verificationMethod === 'human' && !this.verifiedBy) {
    return next(new ErrorResponse('Human verifications must have a verifier', 400));
  }
  next();
});

// Auto-approve automated verifications
verificationSchema.pre('save', function(next) {
  if (this.verificationMethod === 'automated') {
    this.reviewStatus = 'approved';
  }
  next();
});

// Update claim status when verification is created
verificationSchema.post('save', async function(doc) {
  const Claim = mongoose.model('Claim');
  await Claim.findByIdAndUpdate(doc.claimId, { 
    status: doc.verdict === 'unverifiable' ? 'unverifiable' : 'verified'
  });
});

// Indexes for faster queries
verificationSchema.index({ claimId: 1 });
verificationSchema.index({ verifiedBy: 1 });
verificationSchema.index({ verdict: 1, confidenceScore: -1 });

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;