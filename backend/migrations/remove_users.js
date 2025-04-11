// const mongoose = require("mongoose");
// require("dotenv").config();

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     // Update existing claims
//     await mongoose.connection.db
//       .collection("claims")
//       .updateMany({}, { $unset: { submittedBy: "" } });

//     // Drop users collection if exists
//     const collections = await mongoose.connection.db
//       .listCollections()
//       .toArray();
//     if (collections.some((c) => c.name === "users")) {
//       await mongoose.connection.db.dropCollection("users");
//     }

//     console.log("Migration completed successfully");
//     process.exit(0);
//   } catch (err) {
//     console.error("Migration failed:", err);
//     process.exit(1);
//   }
// })();
