const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./utils/logger");
const authRoutes = require("./routes/auth.route");
const claimRoutes = require("./routes/claim.route");
const offlineRoutes = require("./routes/offline.route");
const translationRoutes = require("./routes/translation.route");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/offline", offlineRoutes);
app.use("/api/translate", translationRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
