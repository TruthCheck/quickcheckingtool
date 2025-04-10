// const express = require("express");
// const connectDB = require("./config/connectDB");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // routes should go in here

// // connect mongoDB here
// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// });

const express = require("express");
const app = require("./app");
const connectDB = require("./config/connectDB");
// const redisClient = require("./config/redis");
const logger = require("./utils/logger");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    // await redisClient.connect();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
