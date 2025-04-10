///get Ify to fix this

const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
    },
    verdict: {
      type: String,
      enum: ["true", "false", "misleading", "unverifiable"],
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    translatedExplanations: [
      {
        language: {
          type: String,
          enum: ["en", "ha", "yo", "ig"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
      },
    ],
    sources: [String],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationDate: {
      type: Date,
      default: Date.now,
    },
    expirationDate: Date,
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Verification", verificationSchema);
