// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');

const {
  getAllMarketplaces,
} = require('../../controllers/marketplace.controller');

router.get('/', auth(), getAllMarketplaces);

module.exports = router;
