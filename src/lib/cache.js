// lib/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 minutes TTL, check every 2 minutes

export const getCache = (key) => {
    return cache.get(key);
};

export const setCache = (key, value) => {
    return cache.set(key, value);
};
