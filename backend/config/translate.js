const axios = require("axios");
const logger = require("../utils/logger");

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || "http://localhost:5000";

const translateText = async (text, targetLang, sourceLang = "en") => {
  try {
    const response = await axios.post(`${LIBRETRANSLATE_URL}/translate`, {
      q: text,
      source: sourceLang,
      target: targetLang,
    });

    return response.data.translatedText;
  } catch (error) {
    logger.error("Translation error:", error);
    throw new Error("Translation service unavailable");
  }
};

module.exports = {
  translateText,
};
