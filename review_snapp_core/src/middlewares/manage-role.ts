const mongoose = require('mongoose');
const User = require('../models/user.model');
const httpStatus = require('http-status');

const getUserStoreList = async (userId) => {
  try {
    const userData = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'tbl_roles',
          localField: 'role_id',
          foreignField: '_id',
          as: 'role_data',
        },
      },
      {
        $project: {
          store_ids: { $arrayElemAt: ['$role_data.store_ids', 0] },
          isSuperAdmin: 1,
        },
      },
    ]);

    if (!userData || userData.length === 0) {
      return null;
    }

    const user = userData[0];

    if (!user.isSuperAdmin) {
      const storeIds = Array.isArray(user.store_ids)
        ? user.store_ids
        : [user.store_ids];
      return {
        isSuperAdmin: false,
        storeIds: storeIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    return { isSuperAdmin: true, storeIds: [] };
  } catch (error) {
    console.error('Error fetching user store list:', error);
    throw error;
  }
};

// Middleware to check user stores
const checkUserStores = async (req, res, next) => {
  try {
    const userId =
      req.userId || req.params.userId || req.body.userId || req.query.userId; // Adjust as per your request structure
    if (!userId) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: 'User ID is required' });
    }
    const userData = await getUserStoreList(userId);
    if (!userData) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'User not found' });
    }

    req.storeIds = userData.storeIds;
    req.isSuperAdmin = userData.isSuperAdmin;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

module.exports = checkUserStores;
