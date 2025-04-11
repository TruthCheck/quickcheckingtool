// const jwt = require("jsonwebtoken");
// const User = require("../models/user.model");
// const { errorResponse } = require("../utils/response");
// const logger = require("../utils/logger");

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return errorResponse(res, 401, "Authentication required");
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({
//       _id: decoded.id,
//     });

//     if (!user) {
//       logger.error()
//       return errorResponse(res, 401, "Authentication failed", user);
//     }

//     req.user = user;
//     req.token = token;
//     next();
//   } catch (error) {
//     logger.error("Authentication error:", error);
//     return errorResponse(res, 401, "Invalid authentication");
//   }
// };

// const optionalAuth = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findOne({
//         _id: decoded.id,
//       });

//       if (user) {
//         req.user = user;
//         req.token = token;
//       }
//     }

//     next();
//   } catch (error) {
//     next();
//   }
// };

// module.exports = { auth, optionalAuth };
