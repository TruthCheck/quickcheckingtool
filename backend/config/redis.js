const Redis = require("ioredis");
const dotenv = require("dotenv");

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => {
  console.log("Redis connected successfully ✅");
});

redisClient.on("error", () => {
  console.error("Redis error: ", err);
});

module.exports = redisClient;
