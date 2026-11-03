const express = require('express');
const printomationApp = require('../printomation/index');

const router = express.Router();

// Printomation's API paths include /v2; mount the app at root to avoid /v2/v2.
router.use('/', printomationApp);

module.exports = router;
