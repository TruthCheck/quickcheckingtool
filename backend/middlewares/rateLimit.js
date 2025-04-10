const rateLimit = require("express-rate-limit");
const { errorResponse } = require("../utils/response");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    errorResponse(res, 429, "Too many requests, please try again later");
  },
});

module.exports = { apiLimiter };
