const express = require('express');
const searchController = require('../../controllers/search.controller');

const router = express.Router();

// API endpoint for search orders
router.get('/', searchController.searchOrders);

module.exports = router;
