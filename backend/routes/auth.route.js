// const express = require("express");
// const router = express.Router();
// const User = require("../models/user.model");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const logger = require("../utils/logger");

// router.post("/register", async (req, res) => {
//   try {
//     const { phoneNumber, email, password, preferredLanguage = "en" } = req.body;

//     const existingUser = await User.findOne({ phoneNumber });
//     if (existingUser) {
//       return res.status(400).json({ error: "Phone number already registered" });
//     }

//     const user = new User({
//       phoneNumber,
//       email,
//       passwordHash: password,
//       preferredLanguage,
//     });

//     await user.save();

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN || "7d",
//     });

//     return res.status(201).json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         phoneNumber: user.phoneNumber,
//         preferredLanguage: user.preferredLanguage,
//       },
//     });
//   } catch (error) {
//     logger.error("Registration error:", error);
//     return res.status(500).json({ error: "Registration failed" });
//   }
// });

// router.post("/login", async (req, res) => {
//   try {
//     const { phoneNumber, password } = req.body;

//     const user = await User.findOne({ phoneNumber });
//     if (!user) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN || "7d",
//     });

//     return res.json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         phoneNumber: user.phoneNumber,
//         preferredLanguage: user.preferredLanguage,
//       },
//     });
//   } catch (error) {
//     logger.error("Login error:", error);
//     return res.status(500).json({ error: "Login failed" });
//   }
// });

// module.exports = router;
