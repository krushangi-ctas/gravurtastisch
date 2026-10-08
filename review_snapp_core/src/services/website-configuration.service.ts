// @ts-nocheck
const httpStatus = require('http-status');
const WebsiteConfigurationModel = require('../models/website-configuration.model');

/**
 * Get website configuration
 * @returns {Promise<Object>}
 */
const getWebsiteConfiguration = async () => {
  try {
    const config = await WebsiteConfigurationModel.findOne().sort({ createdAt: -1 });

    return {
      status: httpStatus.OK,
      message: 'Website configuration retrieved successfully.',
      data: config,
    };
  } catch (error) {
    console.error('Error fetching website configuration:', error.message);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to retrieve website configuration.',
      error: error.message,
    };
  }
};

/**
 * Update website configuration
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateWebsiteConfiguration = async (updateData) => {
  try {
    let config = await WebsiteConfigurationModel.findOne().sort({ createdAt: -1 });

    if (!config) {
      config = await WebsiteConfigurationModel.create(updateData);
    } else {
      config = await WebsiteConfigurationModel.findByIdAndUpdate(
        config._id,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    return {
      status: httpStatus.OK,
      message: 'Website configuration updated successfully.',
      data: config,
    };
  } catch (error) {
    console.error('Error updating website configuration:', error.message);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to update website configuration.',
      error: error.message,
    };
  }
};

module.exports = {
  getWebsiteConfiguration,
  updateWebsiteConfiguration,
};
