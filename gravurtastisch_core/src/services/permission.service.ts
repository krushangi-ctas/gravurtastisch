// @ts-nocheck
const Role = require('../models/role.model');
const User = require('../models/user.model');
const {
  buildFullPermissionMap,
  normalizePermissions,
} = require('../config/sections');

/**
 * Legacy sellers (registered before RBAC) have no parentId and are org owners.
 */
const isSellerOwner = (user) =>
  Boolean(
    user.isSellerAdmin ||
      (!user.isSuperAdmin &&
        user.userType !== 'admin' &&
        !user.parentId)
  );

/**
 * Persist missing seller flags for legacy org owners so list filters stay consistent.
 */
const ensureSellerOwnerFlags = async (user) => {
  if (!user || !isSellerOwner(user)) return user;
  if (user.userType === 'seller' && user.isSellerAdmin) return user;

  const id = user._id || user.id;
  await User.updateOne(
    { _id: id },
    { $set: { userType: 'seller', isSellerAdmin: true } }
  );
  user.userType = 'seller';
  user.isSellerAdmin = true;
  return user;
};

const getPermissionsForUser = async (user) => {
  if (!user) {
    return { permissions: {}, role: null };
  }

  if (user.isSuperAdmin) {
    return {
      permissions: buildFullPermissionMap('admin'),
      role: { role_name: 'Super Admin', scope: 'admin', isBypass: true },
    };
  }

  if (isSellerOwner(user)) {
    await ensureSellerOwnerFlags(user);
    return {
      permissions: buildFullPermissionMap('seller'),
      role: { role_name: 'Seller Admin', scope: 'seller', isBypass: true },
    };
  }

  if (!user.role_id) {
    return { permissions: {}, role: null };
  }

  const role = await Role.findOne({
    _id: user.role_id,
    status: 1,
  }).lean();

  if (!role) {
    return { permissions: {}, role: null };
  }

  return {
    permissions: normalizePermissions(role.permissions, role.scope),
    role: {
      id: String(role._id),
      role_name: role.role_name,
      scope: role.scope,
      description: role.description,
    },
  };
};

const can = (permissions, section, action) => {
  if (!permissions || !section || !action) return false;
  const sectionPerm = permissions[section];
  if (!sectionPerm) return false;
  const key = `can${action.charAt(0).toUpperCase()}${action.slice(1)}`;
  return Boolean(sectionPerm[key]);
};

/**
 * Attach permission payload onto a plain user object for API responses.
 */
const enrichUserWithPermissions = async (userDoc) => {
  if (!userDoc) return null;
  const user =
    typeof userDoc.toJSON === 'function' ? userDoc.toJSON() : { ...userDoc };
  const { permissions, role } = await getPermissionsForUser(userDoc);
  return {
    ...user,
    permissions,
    roleInfo: role,
  };
};

/**
 * Seller org data (orders, amazon creds, settings) is stored under the
 * sellerAdmin account. Team users must resolve to their parent owner id.
 */
const resolveSellerOwnerId = (user) => {
  if (!user) return null;
  if (isSellerOwner(user)) {
    return user._id || user.id;
  }
  if (user.parentId) {
    return user.parentId;
  }
  return user._id || user.id;
};

module.exports = {
  getPermissionsForUser,
  can,
  enrichUserWithPermissions,
  isSellerOwner,
  resolveSellerOwnerId,
};
