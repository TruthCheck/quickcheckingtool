const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    originalText: {
      type: String,
      required: true,
      trim: true,
    },
    translatedTexts: [
      {
        language: {
          type: String,
          enum: ["en", "ha", "yo", "ig"],
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    category: {
      type: String,
      enum: ["health", "security", "politics"],
      required: true,
    },
    source: {
      type: String,
      trim: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "in-review", "verified", "debunked"],
      default: "pending",
    },
    imageHash: {
      type: String,
    },
  },
  { timestamps: true }
);

claimSchema.index({ originalText: "text" });
claimSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model("Claim", claimSchema);
