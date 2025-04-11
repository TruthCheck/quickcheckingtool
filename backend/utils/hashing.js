const crypto = require("crypto");

const generateClaimHash = (text) => {
  return crypto.createHash("sha256").update(text).digest("hex");
};

const generateImageHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

module.exports = {
  generateClaimHash,
  generateImageHash,
};

