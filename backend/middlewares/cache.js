const redisClient = require("../config/redis");
const { generateClaimHash } = require("../utils/hashing");
const logger = require("../utils/logger");

const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    const key = req.originalUrl;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      const originalJson = res.json;
      res.json = (body) => {
        redisClient
          .setEx(key, duration, JSON.stringify(body))
          .catch((err) => logger.error("Cache set error:", err));
        originalJson.call(res, body);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error:", error);
      next();
    }
  };
};

const claimCacheMiddleware = async (req, res, next) => {
  const { text } = req.body;
  if (!text) return next();

  const claimHash = generateClaimHash(text);
  try {
    const cached = await redisClient.get(`claim:${claimHash}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    req.claimHash = claimHash;
    next();
  } catch (error) {
    logger.error("Claim cache error:", error);
    next();
  }
};

module.exports = { cacheMiddleware, claimCacheMiddleware };
