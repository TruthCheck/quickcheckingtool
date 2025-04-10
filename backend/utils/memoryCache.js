const NodeCache = require("node-cache");
const logger = require("./logger");

const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
});

module.exports = {
  get: (key) => cache.get(key),
  set: (key, val, ttl) => cache.set(key, val, ttl),
  del: (key) => cache.del(key),
};
