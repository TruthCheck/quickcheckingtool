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
