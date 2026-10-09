const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const http = require('http');
// const cron = require('node-cron');
// const { runSolicitationProcess } = require('./solicitationServices');

let server;
mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    logger.info('Connected to MongoDB');
    // Create HTTP server with Express app
    server = http.createServer(app);

    // Start HTTP server
    server.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err.message || err}`);
    process.exit(1);
  });

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
