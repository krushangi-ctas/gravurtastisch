// @ts-nocheck
const ErrorModel = require('../models/cron-error.model');
const User = require('../models/user.model');
var ip = require('ip');

const resolveErrorScope = async (arg) => {
  if (arg?.scope && typeof arg.scope === 'string') {
    return arg.scope.toLowerCase().trim() === 'seller' ? 'seller' : 'admin';
  }

  const actionType = String(arg?.action_type || '').toLowerCase();

  // Payment logs always belong to admin scope (per user requirement)
  if (
    actionType.includes('payment') ||
    actionType.includes('checkout') ||
    actionType.includes('stripe')
  ) {
    return 'admin';
  }

  // Seller-specific actions
  const sellerKeywords = [
    'amazon-credential',
    'general-setting',
    'feedback',
    'order',
    'seller',
  ];
  if (sellerKeywords.some((k) => actionType.includes(k))) {
    return 'seller';
  }

  // If userId / operation_by provided, look up user
  const userId = arg?.userId || arg?.operation_by;
  if (userId) {
    try {
      const user = await User.findById(userId)
        .select('userType isSellerAdmin isSuperAdmin')
        .lean();
      if (user && (user.userType === 'seller' || user.isSellerAdmin)) {
        return 'seller';
      }
    } catch (e) {
      // ignore
    }
  }

  return 'admin';
};

module.exports.errorM = async function (arg) {
  try {
    let clientIp = '';
    try {
      clientIp = ip.address();
    } catch (e) {
      clientIp = '127.0.0.1';
    }

    const resolvedScope = await resolveErrorScope(arg);

    let errorData = arg?.error_data;
    if (errorData instanceof Error) {
      errorData = {
        name: errorData.name,
        message: errorData.message,
        stack: errorData.stack,
      };
    } else if (typeof errorData === 'object' && errorData !== null) {
      try {
        errorData = JSON.parse(JSON.stringify(errorData));
      } catch (e) {
        // fallback to string
        errorData = String(errorData);
      }
    }

    const error = new ErrorModel({
      action_type: arg?.action_type || 'unhandled-error',
      scope: resolvedScope,
      error_data: errorData,
      operation_by: arg?.userId || arg?.operation_by || null,
      ip_address: arg?.ip_address || clientIp,
    });

    await error.save();
  } catch (err) {
    console.error('Failed to log error to database:', err?.message || err);
  }
};
