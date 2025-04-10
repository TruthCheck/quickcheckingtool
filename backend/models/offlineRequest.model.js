const mongoose = require("mongoose");

const offlineRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  claimText: {
    type: String,
    required: true,
  },
  claimImage: {
    type: Buffer,
  },
  metadata: {
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  status: {
    type: String,
    enum: ["pending", "processed", "failed"],
    default: "pending",
  },
  resultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Verification",
  },
  syncDate: {
    type: Date,
  },
});

offlineRequestSchema.index({ userId: 1, status: 1 });
offlineRequestSchema.index({ "metadata.location": "2dsphere" });

module.exports = mongoose.model("OfflineRequest", offlineRequestSchema);
