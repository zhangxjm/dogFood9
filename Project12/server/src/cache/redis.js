const { createClient } = require('redis');
const config = require('../config');

let client = null;

async function initRedis() {
  if (client) return client;
  
  client = createClient({
    url: config.redisUrl,
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
  });

  client.on('connect', () => {
    console.log('Redis connected successfully');
  });

  try {
    await client.connect();
  } catch (err) {
    console.warn('Redis connection failed, will use memory cache fallback:', err.message);
    client = null;
  }

  return client;
}

async function getCache(key) {
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Redis get error:', err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 60) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  } catch (err) {
    console.warn('Redis set error:', err.message);
  }
}

async function deleteCache(key) {
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.warn('Redis delete error:', err.message);
  }
}

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
};
