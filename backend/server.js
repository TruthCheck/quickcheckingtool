const express = require("express");
const connectDB = require("./config/connectDB");
const cors = require("cors");
const dotenv = require("dotenv");
const verificationRoute = require('./routes/verificationRoute');
const { errorHandler } = require('./utils/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(errorHandler);

// routes should go in here
app.use('/api/verifications', verificationRoute);

// connect mongoDB here
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
