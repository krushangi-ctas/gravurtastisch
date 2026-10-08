// controllers/marketplaceController.js
const marketplaceService = require('../services/marketplace.service');
const catchAsync = require('../utils/catchAsync');

const getAllMarketplaces = catchAsync(async (req, res) => {
  try {
    const { status, message, data } =
      await marketplaceService.getMarketplaces();
    return res.status(status).send({ status, message, data });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: 'Unexpected error',
      error: err.message,
    });
  }
});

module.exports = { getAllMarketplaces };
