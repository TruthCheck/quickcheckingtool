const mongoose = require("mongoose");

const officialSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["health", "security", "politics"],
    required: true,
  },
  language: {
    type: String,
    enum: ["en", "ha", "yo", "ig"],
    required: true,
  },
  apiEndpoint: {
    type: String,
  },
  authenticationMethod: {
    type: String,
  },
  lastSynced: {
    type: Date,
  },
  reliabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 80,
  },
});

module.exports = mongoose.model("OfficialSource", officialSourceSchema);
