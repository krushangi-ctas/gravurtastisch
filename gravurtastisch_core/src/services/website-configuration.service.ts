const httpStatus = require('http-status');
const WebsiteConfigurationModel = require('../models/website-configuration.model');
const errorHandler = require('../utils/error.handler');
const { systemLog } = require('../utils/system-log');

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
    errorHandler.errorM({
      action_type: 'get-website-configuration',
      error_data: error,
      scope: 'admin',
    });
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
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const updateWebsiteConfiguration = async (updateData, userId) => {
  try {
    let config = await WebsiteConfigurationModel.findOne().sort({ createdAt: -1 });
    const existingConfig = config
      ? config.toObject
        ? config.toObject()
        : JSON.parse(JSON.stringify(config))
      : {};

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

    await systemLog(
      'UPDATE',
      config.toObject ? config.toObject() : config,
      userId,
      'update-website-configuration',
      existingConfig
    );

    return {
      status: httpStatus.OK,
      message: 'Website configuration updated successfully.',
      data: config,
    };
  } catch (error) {
    console.error('Error updating website configuration:', error.message);
    errorHandler.errorM({
      action_type: 'update-website-configuration',
      error_data: error,
    });
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
