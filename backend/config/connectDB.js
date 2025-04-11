const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logger");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected successfully 🎉");
    logger.info("MongoDB Connected. Just to be sure...😉");
  } catch (err) {
    console.error("MongoDB connection error: ⛔", err);
    logger.error("MongoDB Connection Error: 🙏", err);
    process.exit(1);
  }
};

// for debugging purposes please. error wan wound me!
mongoose.connection.on("connected", () => {
  logger.info("MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

module.exports = connectDB;
