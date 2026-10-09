// @ts-nocheck
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const GeneralSettingModel = require('../models/generalSetting.model');
const UserModel = require('../models/user.model');
const AmazonCredentialsModel = require('../models/amazon-credentials.model');

const generalSettingsByUpdate = async (userId, updateData = {}) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'User not found',
      };
    }

    const maxMarketplaces = user.planLimits?.maxMarketplaces ?? 5;
    const activeMarketplacesCount = Array.isArray(updateData.activeMarketplaces)
      ? updateData.activeMarketplaces.length
      : 0;

    if (activeMarketplacesCount > maxMarketplaces) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: `Active marketplaces limit exceeded. Your plan allows a maximum of ${maxMarketplaces} active marketplaces, but you attempted to activate ${activeMarketplacesCount}.`,
      };
    }

    const existingSettings = await GeneralSettingModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $ne: 2 },
    });

    const areArraysEqual = (arr1, arr2) => {
      if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
      if (arr1.length !== arr2.length) return false;
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      return sorted1.every((val, index) => val === sorted2[index]);
    };

    if (updateData.activeMarketplaces !== undefined) {
      if (existingSettings) {
        const isChanging = !areArraysEqual(
          updateData.activeMarketplaces,
          existingSettings.activeMarketplaces
        );
        if (isChanging) {
          updateData.activeMarketplacesLastUpdated = new Date();
        }
      } else {
        updateData.activeMarketplacesLastUpdated = new Date();
      }
    }

    const credentialsDoc = await AmazonCredentialsModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    const finalUpdateData = {
      ...updateData,
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (credentialsDoc) {
      finalUpdateData.amazonCredentialId = credentialsDoc._id;
    }

    const updatedDoc = await GeneralSettingModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), status: { $ne: 2 } }, // Condition
      finalUpdateData,
      {
        new: true, // Return the updated (or inserted) document
        upsert: true, // Insert if not found
      }
    );

    return {
      data: updatedDoc,
      status: httpStatus.OK,
    };
  } catch (error) {
    console.error('Error in generalSettings update:', error.message);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to update or insert general settings.',
      error: error.message,
    };
  }
};

const generalSettingsByGet = async (userId) => {
  try {
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      status: { $ne: 2 },
    };
    const updatedDoc = await GeneralSettingModel.findOne(query);

    if (!updatedDoc) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'No general setting found.',
        data: null,
      };
    }

    return {
      data: updatedDoc,
      status: httpStatus.OK,
    };
  } catch (error) {
    console.error('Error in generalSettings get:', error.message);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to get general settings.',
      error: error.message,
    };
  }
};

module.exports = {
  generalSettingsByUpdate,
  generalSettingsByGet,
};
