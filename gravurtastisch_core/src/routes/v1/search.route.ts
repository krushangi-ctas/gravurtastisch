const express = require('express');
const searchController = require('../../controllers/search.controller');

const router = express.Router();

// Render search page with results
router.get('/', searchController.renderSearchPage);

// API endpoint for AJAX search (optional)
router.get('/', searchController.searchOrders);

module.exports = router;
