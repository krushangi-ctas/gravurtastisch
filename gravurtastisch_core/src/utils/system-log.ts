// @ts-nocheck
const SystemLogsModel = require('../models/system-logs.model');
const User = require('../models/user.model');
var ip = require('ip');

const resolveScope = async (explicitScope, key, data, userId) => {
  if (explicitScope && typeof explicitScope === 'string') {
    return explicitScope.toLowerCase().trim() === 'seller' ? 'seller' : 'admin';
  }

  // Payment logs always belong to admin scope (per user requirement)
  const paymentKeys = [
    'create-checkout-session',
    'payment-paid',
    'cancel-payment',
    'create-payment',
    'update-payment',
  ];
  if (paymentKeys.includes(key)) {
    return 'admin';
  }

  // Seller-specific actions
  const sellerKeys = [
    'update-amazon-credentials',
    'update-amazon-authorisation',
    'update-general-settings',
    'update-feedback',
  ];
  if (sellerKeys.includes(key)) {
    return 'seller';
  }

  // Check performer first! If performer is Super Admin or Admin, the log always belongs to admin scope
  if (userId) {
    try {
      const performer = await User.findById(userId)
        .select('userType isSellerAdmin isSuperAdmin')
        .lean();
      if (performer) {
        if (performer.isSuperAdmin || performer.userType === 'admin') {
          return 'admin';
        }
        if (performer.userType === 'seller' || performer.isSellerAdmin) {
          return 'seller';
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Explicit scope inside data object (e.g. role or section model)
  if (data?.scope && typeof data.scope === 'string') {
    return data.scope.toLowerCase().trim() === 'seller' ? 'seller' : 'admin';
  }

  // Super Admin and admin users always belong to admin scope
  if (data?.isSuperAdmin || data?.userType === 'admin') {
    return 'admin';
  }

  // User type checks
  if (data?.userType === 'seller') {
    return 'seller';
  }

  return 'admin';
};

/**
 *
 * @param {'UPDATE'|'DELETE'|'CREATE'|'LOGIN'|'LOGOUT'} operationType
 * @param {Object<any>} data
 * @param {string} userId
 * @param {string} key
 * @param {Object<any>} oldData
 * @param {string} explicitScope
 */
const systemLog = async (
  operationType,
  data,
  userId,
  key,
  oldData = {},
  explicitScope = null
) => {
  try {
    let clientIp = '';
    try {
      clientIp = ip.address();
    } catch (e) {
      clientIp = '127.0.0.1';
    }

    const resolvedScope = await resolveScope(explicitScope, key, data, userId);

    const cleanData = (obj) => {
      if (!obj) return {};
      if (typeof obj.toObject === 'function') {
        obj = obj.toObject();
      } else if (typeof obj.toJSON === 'function') {
        obj = obj.toJSON();
      }
      try {
        const cloned = JSON.parse(JSON.stringify(obj));
        delete cloned.password;
        delete cloned.token;
        delete cloned.operation_by;
        return cloned;
      } catch (e) {
        return { ...obj };
      }
    };

    const operationData = {
      operation: operationType,
      operation_by: userId || null,
      key: key,
      scope: resolvedScope,
      ip_address: clientIp,
    };

    const currentData = cleanData(data);
    const previousData = cleanData(oldData);

    if (operationType === 'UPDATE') {
      const allKeys = new Set([
        ...Object.keys(previousData || {}),
        ...Object.keys(currentData || {}),
      ]);
      const oldChanges = { _id: previousData._id || currentData._id };
      const newChanges = { _id: currentData._id || previousData._id };

      for (const k of allKeys) {
        if (k === '_id' || k === 'updatedAt' || k === '__v') continue;
        if (JSON.stringify(previousData[k]) !== JSON.stringify(currentData[k])) {
          oldChanges[k] = previousData[k] !== undefined ? previousData[k] : null;
          newChanges[k] = currentData[k] !== undefined ? currentData[k] : null;
        }
      }

      operationData.operation_data = [
        {
          oldData: oldChanges,
          updatedData: newChanges,
        },
      ];
    } else {
      operationData.operation_data = Array.isArray(currentData)
        ? currentData
        : [currentData];
    }

    await SystemLogsModel.create(operationData);
  } catch (err) {
    console.error('Failed to create system log:', err?.message || err);
  }
};

module.exports = {
  systemLog,
};
