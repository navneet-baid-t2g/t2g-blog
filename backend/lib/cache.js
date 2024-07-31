const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // Cache TTL (Time To Live) in seconds

// Function to get cached data
const getCache = (key) => {
  return cache.get(key);
};

// Function to set data in cache
const setCache = (key, value) => {
  cache.set(key, value);
};

// Function to clear cache
const clearCache = (key) => {
  cache.del(key);
};

module.exports = {
  getCache,
  setCache,
  clearCache
};
