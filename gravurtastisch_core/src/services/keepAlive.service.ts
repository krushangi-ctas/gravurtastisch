// @ts-nocheck
const axios = require('axios');
const cron = require('node-cron');
const config = require('../config/config');
const logger = require('../config/logger');

let cronTask = null;
let initialTimeout = null;

/**
 * Resolve target URL to ping for keep-alive using SITE_URL from config.
 * When deployed on Render or production, SITE_URL is set to the production URL,
 * which routes traffic through Render's reverse proxy/router, resetting Render's 15-minute inactivity shutdown timer.
 */
const getKeepAliveUrl = () => {
  if (config.site_url && typeof config.site_url === 'string') {
    const trimmed = config.site_url.trim().replace(/\/+$/, '');
    if (trimmed) {
      return trimmed;
    }
  }
  return `http://localhost:${config.port || 7051}`;
};

/**
 * Ping the health endpoint using config.site_url
 */
const pingHealth = async () => {
  const baseUrl = getKeepAliveUrl();
  const healthUrl = `${baseUrl}/health`;
  try {
    const startTime = Date.now();
    const response = await axios.get(healthUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Gravurtastisch-KeepAlive-Ping/1.0',
        'Cache-Control': 'no-cache',
      },
    });
    const durationMs = Date.now() - startTime;
    logger.info(
      `[Keep-Alive] 5-minute health check successful -> ${healthUrl} (status: ${response.status}, uptime: ${response.data?.uptime || 0}s, latency: ${durationMs}ms)`
    );
  } catch (err) {
    logger.warn(
      `[Keep-Alive] 5-minute health check ping warning -> ${healthUrl}: ${err?.message || err}`
    );
  }
};

/**
 * Start the 5-minute keep-alive scheduler
 */
const startKeepAlive = () => {
  if (cronTask) {
    return;
  }

  logger.info(
    '[Keep-Alive] Initializing 5-minute health check keeper (cron: */5 * * * *)'
  );

  // Trigger initial ping 10 seconds after server boot
  initialTimeout = setTimeout(() => {
    pingHealth().catch((err) => {
      logger.warn(`[Keep-Alive] Initial ping error: ${err.message}`);
    });
    try {
      const { autoPromoteAllExpiredUserPlans } = require('./plan.service');
      autoPromoteAllExpiredUserPlans().catch((err) => {
        logger.warn(`[Plan-Sync] Initial plan sync error: ${err.message}`);
      });
    } catch (_) {}
  }, 10000);

  // Schedule every 5 minutes: '*/5 * * * *'
  cronTask = cron.schedule('*/5 * * * *', () => {
    pingHealth().catch((err) => {
      logger.warn(`[Keep-Alive] Scheduled ping error: ${err.message}`);
    });
    try {
      const { autoPromoteAllExpiredUserPlans } = require('./plan.service');
      autoPromoteAllExpiredUserPlans().catch((err) => {
        logger.warn(`[Plan-Sync] Scheduled plan sync error: ${err.message}`);
      });
    } catch (_) {}
  });
};

/**
 * Stop the keep-alive scheduler cleanly
 */
const stopKeepAlive = () => {
  if (initialTimeout) {
    clearTimeout(initialTimeout);
    initialTimeout = null;
  }
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[Keep-Alive] Health check scheduler stopped');
  }
};

module.exports = {
  pingHealth,
  startKeepAlive,
  stopKeepAlive,
  getKeepAliveUrl,
};
