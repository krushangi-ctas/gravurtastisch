// @ts-nocheck
const MarketplaceModel = require('../models/marketplace.model');
const httpStatus = require('http-status');

const getMarketplaces = async () => {
  try {
    const marketplaces = await MarketplaceModel.find({ status: 1 }).sort({
      country: 1,
    });

    return {
      status: httpStatus.OK,
      message: 'Marketplaces fetched successfully',
      data: marketplaces,
    };
  } catch (error) {
    console.error('Error fetching marketplaces:', error);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch marketplaces',
      error: error.message,
    };
  }
};

module.exports = {
  getMarketplaces,
};
