const Redis = require("ioredis");
const dotenv = require("dotenv");

dotenv.config();

const redisClient = new Redis({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_URL,
  port: process.env.REDIS_PORT,
  tls: {},
});

redisClient.on("connect", () => {
  console.log("Redis connected successfully ✅");
});

redisClient.on("error", (err) => {
  console.error("Redis error: ", err);
});

module.exports = redisClient;




