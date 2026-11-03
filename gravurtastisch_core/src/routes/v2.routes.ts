const express = require('express');
const printomationApp = require('../printomation/index');
const authRoute = require('./v1/auth.route');

const router = express.Router();

// Auto-correct any accidental /v2/v2 duplication from client requests or reverse proxies
router.use((req, res, next) => {
  if (req.url.startsWith('/v2/v2/')) {
    req.url = req.url.replace(/^\/v2\/v2\//, '/v2/');
  }
  next();
});

// Expose Core Auth under /v2/auth for Printomation frontend
router.use('/v2/auth', authRoute);
router.use('/auth', authRoute);

// Printomation's API paths include /v2; mount the app at root to avoid /v2/v2.
router.use('/', printomationApp);

module.exports = router;
