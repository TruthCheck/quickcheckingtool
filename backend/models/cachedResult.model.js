const mongoose = require("mongoose");

const cachedResultSchema = new mongoose.Schema({
  claimHash: {
    type: String,
    required: true,
    unique: true,
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Verification",
    required: true,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  accessCount: {
    type: Number,
    default: 1,
  },
  languagesAvailable: {
    type: [String],
    enum: ["en", "ha", "yo", "ig"],
    default: ["en"],
  },
});

// cachedResultSchema.index({ claimHash: 1 });
cachedResultSchema.index({ lastAccessed: 1 });

module.exports = mongoose.model("CachedResult", cachedResultSchema);
