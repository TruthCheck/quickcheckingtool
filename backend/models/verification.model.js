const verificationSchema = new mongoose.Schema({
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Claim",
    required: [true, 'Claim ID is required']
  },
  verificationMethod: {
    type: String,
    required: [true, 'Method is required'],
    enum: ['automated', 'human', 'partner', 'official'],
    default: 'automated'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.verificationMethod === 'human';
    }
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
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      }
    },
    type: {
      type: String,
      enum: ['official', 'news', 'expert', 'other'],
      required: true
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
  disputeReason: {
    type: String,
    required: function() {
      return this.isDisputed;
    }
  },
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
    status: doc.verdict === 'unverifiable' ? 'unverifiable' : 'verified',
    lastVerifiedAt: new Date()
  });
});


verificationSchema.index({ claimId: 1 });
verificationSchema.index({ verifiedBy: 1 });
verificationSchema.index({ verdict: 1, confidenceScore: -1 });