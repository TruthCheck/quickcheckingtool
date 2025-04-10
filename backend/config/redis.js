// const Redis = require("ioredis");
// const dotenv = require("dotenv");

// dotenv.config();

// const redisClient = new Redis({
//   username: "default",
//   password: process.env.REDIS_PASSWORD,
//   host: process.env.REDIS_URL,
//   port: process.env.REDIS_PORT,
//   tls: {},
// });

// redisClient.on("connect", () => {
//   console.log("Redis connected successfully ✅");
// });

// redisClient.on("error", (err) => {
//   console.error("Redis error: ", err);
// });

// module.exports = redisClient;

// const { createClient } = require("redis");

// const client = createClient({
//   username: "default",
//   password: "M8DXf9Hl69ipkSaIfCvvjURVP6W4Z56z",
//   socket: {
//     host: "redis-14714.c341.af-south-1-1.ec2.redns.redis-cloud.com",
//     port: 14714,
//   },
// });

// client.on("error", (err) => console.log("Redis Client Error", err));

// async function startServer() {
//   try {
//     await client.connect(); // Ensure this is async and works correctly
//     console.log("Redis connected successfully!");

//     await client.set("foo", "bar");
//     const result = await client.get("foo");
//     console.log(result); // Should print "bar"
//   } catch (error) {
//     console.error("Error connecting to Redis", error);
//   }
// }

// startServer();


