const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger");

exports.register = async (req, res) => {
  try {
    const { phoneNumber, email, password, preferredLanguage = "en" } = req.body;

    if (!phoneNumber || !password) {
      return errorResponse(res, 400, "Phone number and password are required");
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return errorResponse(res, 400, "Phone number already registered");
    }

    const user = new User({
      phoneNumber,
      email,
      passwordHash: password,
      preferredLanguage,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return successResponse(res, 201, {
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    return errorResponse(res, 500, "Registration failed");
  }
};

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return errorResponse(res, 400, "Phone number and password are required");
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });


    user.lastActive = new Date();
    await user.save();

    return successResponse(res, 200, {
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    return errorResponse(res, 500, "Login failed");
  }
};
