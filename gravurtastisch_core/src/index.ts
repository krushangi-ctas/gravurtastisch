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

// 1. Immediately create and start the HTTP server so Render detects the open port
server = http.createServer(app);
server.listen(config.port, () => {
  logger.info(`Listening to port ${config.port}`);
  // Start 5-minute health check keep-alive service
  startKeepAlive();
});

// 2. Connect to MongoDB asynchronously without blocking or crashing the HTTP server
const connectMongoDB = async () => {
  const sanitizedUrl = getSanitizedMongoHost(config.mongoose.url || '');
  logger.info(`[MongoDB] Initializing connection to: ${sanitizedUrl}`);

  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Connected to MongoDB successfully');
  } catch (err: any) {
    logger.error(`[MongoDB] Connection error: ${err.message || err}`);
    logger.warn('HTTP server remains active and healthy. MongoDB will auto-reconnect when database host is reachable.');
  }
};

mongoose.connection.on('connected', () => {
  logger.info('[MongoDB] Connection established successfully');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[MongoDB] Connection lost. Attempting auto-reconnect...');
});

mongoose.connection.on('error', (err: any) => {
  logger.error(`[MongoDB] Runtime error: ${err.message || err}`);
});

connectMongoDB();

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
