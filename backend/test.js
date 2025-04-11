// require("dotenv").config();
// const connectDB = require("./config/connectDB");
// const factCheckService = require("./services/factCheck.service");
// const logger = require("./utils/logger");

// (async () => {
//   try {
//     // 1. First connect to MongoDB
//     logger.info("Connecting to MongoDB...");
//     await connectDB();

//     // 2. Then test the service
//     logger.info("Testing fact check service...");
//     const result = await factCheckService.verifyClaim(
//       "Direct test - COVID vaccines are safe",
//       "health",
//       "en"
//     );

//     logger.info("Test succeeded:", result);
//     process.exit(0);
//   } catch (error) {
//     logger.error("Test failed:", error);
//     process.exit(1);
//   }
// })();

// Test script
// const FactCheckService = require("./services/factCheck.service");

// (async () => {
//   try {
//     const result = await FactCheckService.verifyClaim(
//       "COVID vaccines contain microchips",
//       "health"
//     );
//     console.log("Verification Result:", result);
//   } catch (error) {
//     console.error("Test failed:", error.message);
//   }
// })();

// test.js
const FactCheckService = require("./services/factCheck.service");

(async () => {
  const result = await FactCheckService.checkGoogleFactCheck(
    "COVID vaccines are safe"
  );
  console.log("API Response:", result?.claims?.[0]);
})();
