const axios = require("axios");
const logger = require("../utils/logger");

module.exports = class GoogleFactCheckAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://factchecktools.googleapis.com/v1alpha1";
  }

  async search(query, languageCode = "en") {
    try {
      const response = await axios.get(`${this.baseUrl}/claims:search`, {
        params: {
          key: this.apiKey,
          query: query,
          languageCode: languageCode,
        },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      logger.error("Google FactCheck API error:", error);
      return null;
    }
  }
};
