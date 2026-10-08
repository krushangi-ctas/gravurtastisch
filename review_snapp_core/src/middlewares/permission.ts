const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const {
  ADMIN_SECTIONS,
  SELLER_SECTIONS,
} = require('../config/sections');
const {
  getPermissionsForUser,
  can,
  isSellerOwner,
} = require('../services/permission.service');

const ADMIN_SECTION_KEYS = ADMIN_SECTIONS.map((s) => s.key);
const SELLER_SECTION_KEYS = SELLER_SECTIONS.map((s) => s.key);

const hasBypassForSection = (user, section) => {
  if (!user) return false;
  if (user.isSuperAdmin) {
    return ADMIN_SECTION_KEYS.includes(section);
  }
  if (
    user.userType !== 'admin' &&
    isSellerOwner(user) &&
    SELLER_SECTION_KEYS.includes(section)
  ) {
    return true;
  }
  return false;
};

/**
 * Require a section action permission.
 * SuperAdmin and sellerAdmin bypass checks (sellerAdmin only for seller sections).
 *
 * @param {string} section
 * @param {'view'|'create'|'update'|'delete'} action
 */
const requirePermission =
  (section, action = 'view') =>
  async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }

      if (hasBypassForSection(req.user, section)) {
        return next();
      }

      const { permissions } = await getPermissionsForUser(req.user);
      req.permissions = permissions;

      if (!can(permissions, section, action)) {
        return next(
          new ApiError(
            httpStatus.FORBIDDEN,
            `Missing permission: ${section}.${action}`
          )
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

/**
 * Allow access when the user matches ANY of the given section/action pairs.
 * Useful for role dropdowns needed while creating/updating users.
 *
 * @param {Array<[string, string]>} requirements
 */
const requireAnyPermission =
  (requirements = []) =>
  async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }

      for (const [section] of requirements) {
        if (hasBypassForSection(req.user, section)) {
          return next();
        }
      }

      const { permissions } = await getPermissionsForUser(req.user);
      req.permissions = permissions;

      const allowed = requirements.some(([section, action]) =>
        can(permissions, section, action)
      );

      if (!allowed) {
        const label = requirements
          .map(([section, action]) => `${section}.${action}`)
          .join(' | ');
        return next(
          new ApiError(httpStatus.FORBIDDEN, `Missing permission: ${label}`)
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

module.exports = requirePermission;
module.exports.requirePermission = requirePermission;
module.exports.requireAnyPermission = requireAnyPermission;
