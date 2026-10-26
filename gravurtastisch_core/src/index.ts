const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const http = require('http');
const { startKeepAlive, stopKeepAlive } = require('./services/keepAlive.service');
// const cron = require('node-cron');
// const { runSolicitationProcess } = require('./solicitationServices');

let server;

const getSanitizedMongoHost = (url) => {
  try {
    return url.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
  } catch (_) {
    return '(url hidden)';
  }
};

const startServer = async () => {
  const maxRetries = 3;
  const retryDelayMs = 5000;
  const sanitizedUrl = getSanitizedMongoHost(config.mongoose.url || '');

  logger.info(`[MongoDB] Initializing connection to: ${sanitizedUrl}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(config.mongoose.url, config.mongoose.options);
      logger.info('Connected to MongoDB successfully');

      // Create HTTP server with Express app
      server = http.createServer(app);

      // Start HTTP server
      server.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`);
        // Start 5-minute health check keep-alive service
        startKeepAlive();
      });
      return;
    } catch (err) {
      logger.error(`[MongoDB] Connection attempt ${attempt}/${maxRetries} failed: ${err.message || err}`);
      if (attempt < maxRetries) {
        logger.info(`[MongoDB] Retrying connection in ${retryDelayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        logger.error('============================================================');
        logger.error('CRITICAL: MongoDB connection timed out after multiple attempts.');
        logger.error('HOW TO FIX ON RENDER / CLOUD HOSTING:');
        logger.error('1. Open MongoDB Atlas (https://cloud.mongodb.com)');
        logger.error('2. Navigate to "Security" -> "Network Access"');
        logger.error('3. Click "Add IP Address" and choose "Allow Access from Anywhere" (0.0.0.0/0)');
        logger.error('   Render instances use dynamic cloud IPs, so 0.0.0.0/0 is required.');
        logger.error('4. Check your MONGODB_URL in Render Dashboard:');
        logger.error('   Ensure username/password are correct and special characters are URL-encoded.');
        logger.error('============================================================');
        process.exit(1);
      }
    }
  }
};

startServer();

const forceExit = (code = 0) => {
  // Keep-alive / Mongo sockets can keep the process alive after server.close()
  setTimeout(() => process.exit(code), 300).unref();
};

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
    forceExit(1);
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

const shutdown = (signal) => {
  logger.info(`${signal} received`);
  stopKeepAlive();
  const finish = () => {
    mongoose.connection.close(() => process.exit(0));
  };
  if (server) {
    server.close(finish);
  } else {
    finish();
  }
  // Fast path for `node --watch` restarts (open sockets can hang close)
  forceExit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// cron.schedule('*/10 * * * *', runSolicitationProcess);
// cron.schedule('*/5 * * * *', manageOrders);
// cron.schedule('*/15 * * * *', autoFeedbackRequest);

// setTimeout(() => {
//   runSolicitationProcess();
//   manageOrders();
//   autoFeedbackRequest();
// }, 3000);
