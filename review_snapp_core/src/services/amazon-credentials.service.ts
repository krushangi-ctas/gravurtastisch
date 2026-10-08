// @ts-nocheck
const AmazonCredentialsModel = require('../models/amazon-credentials.model');
const User = require('../models/user.model');
const logger = require('../config/logger');
const mongoose = require('mongoose');

const handleWithCredentialResponse = (credentials, id) => {
  if (!credentials) {
    logger.warn(`No Amazon credentials found for ID: ${id}`);
    throw new Error('Amazon credentials not found');
  }

  // Return only non-sensitive fields
  const response = {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: credentials.refresh_token,
    seller_id: credentials.seller_id,
    marketplace_id: credentials.marketplace_id,
  };

  return {
    status: 200,
    message: 'Amazon credentials retrieved successfully',
    data: response,
  };
};
/**
 * Get Amazon credentials by ID
 * @param {string} id - The ID of the credentials
 * @returns {Promise<Object>} Result object
 */
const getAmazonCredentialsById = async (id) => {
  try {
    const credentials = await AmazonCredentialsModel.findById(id);
    return handleWithCredentialResponse(credentials, id);
  } catch (error) {
    logger.error(`Error fetching Amazon credentials by ID ${id}:`, error);
    return {
      status: 500,
      message: error.message,
    };
  }
};

/**
 * Get Amazon credentials by ID
 * @param {string} id - The ID of the credentials
 * @returns {Promise<Object>} Result object
 */
const getAmazonCredentialsByUserId = async (id) => {
  try {
    const credentials = await AmazonCredentialsModel.findOne({
      userId: new mongoose.Types.ObjectId(id),
    });
    return handleWithCredentialResponse(credentials, id);
  } catch (error) {
    logger.error(`Error fetching Amazon credentials by ID ${id}:`, error);
    return {
      status: 500,
      message: error.message,
    };
  }
};
/**
 * Create or update Amazon credentials
 * @param {Object} credentialsData - The credentials data
 * @returns {Promise<Object>} Result object
 */
const upsertAmazonCredentials = async (credentialsData, userId) => {
  try {
    const user = await User.findById(userId);
    const maxMarketplaces = user?.planLimits?.maxMarketplaces ?? 5;

    if (
      Array.isArray(credentialsData.marketplace_ids) &&
      credentialsData.marketplace_ids.length > maxMarketplaces
    ) {
      return {
        status: 400,
        message: `Active marketplaces limit exceeded. Your plan allows a maximum of ${maxMarketplaces} active marketplaces, but you selected ${credentialsData.marketplace_ids.length}. Please upgrade your plan or unselect existing marketplaces.`,
      };
    }

    const result = await AmazonCredentialsModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        userId,
        client_id: credentialsData.client_id,
        client_secret: credentialsData.client_secret,
        refresh_token: credentialsData.refresh_token,
        seller_id: credentialsData.seller_id,
        marketplace_id: credentialsData.marketplace_ids,
      },
      {
        new: true,
        upsert: true,
      }
    );

    return {
      status: 200,
      message: 'Amazon credentials updated successfully',
      data: {
        client_id: result.client_id,
        seller_id: result.seller_id,
        marketplace_ids: result.marketplace_id,
        auth_url: result.auth_url,
        sp_api_base_url: result.sp_api_base_url,
      },
    };
  } catch (error) {
    logger.error('Error updating Amazon credentials:', error);
    return {
      status: 500,
      message: error.message,
    };
  }
};

module.exports = {
  getAmazonCredentialsById,
  upsertAmazonCredentials,
  getAmazonCredentialsByUserId,
};
