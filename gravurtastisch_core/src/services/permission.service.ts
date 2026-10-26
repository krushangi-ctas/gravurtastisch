// @ts-nocheck
const Role = require('../models/role.model');
const User = require('../models/user.model');
const {
  normalizePermissions,
  fullPermission,
} = require('../config/sections');
const Section = require('../models/section.model');

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
    const sections = await Section.find({ scope: 'admin', status: 1 }).lean();
    const fullPermissions = sections.reduce((acc, s) => {
      acc[s.name] = fullPermission();
      const clean = s.name.replace(/^\//, '');
      acc[clean] = fullPermission();
      return acc;
    }, {});

    return {
      permissions: fullPermissions,
      role: { role_name: 'Super Admin', scope: 'admin', isBypass: true },
    };
  }

  if (isSellerOwner(user)) {
    await ensureSellerOwnerFlags(user);
    const sections = await Section.find({
      scope: 'seller',
      status: 1,
      $or: [{ ownerId: user._id || user.id }, { ownerId: null }],
    }).lean();
    const fullPermissions = sections.reduce((acc, s) => {
      acc[s.name] = fullPermission();
      const clean = s.name.replace(/^\//, '');
      acc[clean] = fullPermission();
      return acc;
    }, {});

    return {
      permissions: fullPermissions,
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

  const rolePermissionsMap = {};
  if (Array.isArray(role.section_list) && role.section_list.length > 0) {
    role.section_list.forEach((s) => {
      if (!s || !s.name) return;
      const flags = {
        canView: Boolean(s.permissions?.view),
        canCreate: Boolean(s.permissions?.add),
        canUpdate: Boolean(s.permissions?.update),
        canDelete: Boolean(s.permissions?.delete),
      };
      rolePermissionsMap[s.name] = flags;
      const clean = s.name.replace(/^\//, '');
      rolePermissionsMap[clean] = flags;
    });
  }
  if (Array.isArray(role.permissions) && role.permissions.length > 0) {
    const legacyMap = normalizePermissions(role.permissions);
    Object.assign(rolePermissionsMap, legacyMap);
    role.permissions.forEach((item) => {
      if (!item || !item.section) return;
      const flags = {
        canView: Boolean(item.canView || item.view),
        canCreate: Boolean(item.canCreate || item.add),
        canUpdate: Boolean(item.canUpdate || item.update),
        canDelete: Boolean(item.canDelete || item.delete),
      };
      rolePermissionsMap[item.section] = flags;
      const clean = item.section.replace(/^\//, '');
      rolePermissionsMap[clean] = flags;
    });
  }

  return {
    permissions: rolePermissionsMap,
    role: {
      id: String(role._id),
      name: role.name || role.role_name,
      role_name: role.role_name || role.name,
      scope: role.scope,
      description: role.description,
    },
  };
};

const can = (permissions, section, action) => {
  if (!permissions || !section || !action) return false;

  let actionKey = action;
  if (action === 'add') actionKey = 'create';
  const flagKey = `can${actionKey.charAt(0).toUpperCase()}${actionKey.slice(1)}`;

  const checkPerm = (perm) => {
    if (!perm) return false;
    return Boolean(
      perm[flagKey] !== undefined
        ? perm[flagKey]
        : perm[action] !== undefined
        ? perm[action]
        : false
    );
  };

  const clean = section.replace(/^\//, '').toLowerCase();

  // 1. Direct match (exact normalized key)
  const directKey = Object.keys(permissions).find(
    (k) => k.replace(/^\//, '').toLowerCase() === clean
  );
  if (directKey && permissions[directKey]) {
    return checkPerm(permissions[directKey]);
  }

  // 2. Suffix match (e.g. 'roles' matches 'team/roles' or 'user-management/roles')
  const suffixKey = Object.keys(permissions).find(
    (k) => k.replace(/^\//, '').toLowerCase().endsWith('/' + clean)
  );
  if (suffixKey && permissions[suffixKey]) {
    return checkPerm(permissions[suffixKey]);
  }

  // 3. Prefix match for grouped sections (e.g. 'team' matches if any 'team/*' has permission)
  const hasPrefixMatch = Object.entries(permissions).some(
    ([k, v]) =>
      k.replace(/^\//, '').toLowerCase().startsWith(clean + '/') &&
      checkPerm(v)
  );
  if (hasPrefixMatch) {
    return true;
  }

  return false;
};

/**
 * Attach permission payload onto a plain user object for API responses.
 */
const enrichUserWithPermissions = async (userDoc) => {
  if (!userDoc) return null;
  try {
    const { syncUserMonthlyUsage } = require('./plan.service');
    await syncUserMonthlyUsage(userDoc);
  } catch (_) {}
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
