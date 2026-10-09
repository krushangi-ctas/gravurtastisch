/**
 * Canonical section keys for RBAC.
 * Admin: `sellers` (seller org accounts), `users` (admin staff).
 * Seller scope uses `user` for team management.
 */

const ACTIONS = ['canView', 'canCreate', 'canUpdate', 'canDelete'];

const ADMIN_SECTIONS = [
  { key: 'sellers', title: 'Sellers' },
  { key: 'users', title: 'Admin Users' },
  { key: 'roles', title: 'Roles' },
  { key: 'support', title: 'Customer Support' },
  { key: 'blogs', title: 'Blog Management' },
  { key: 'site-configuration', title: 'Site Configuration' },
  { key: 'plans', title: 'Plans' },
  { key: 'settings', title: 'Settings' },
];

const SELLER_SECTIONS = [
  { key: 'user', title: 'User Management' },
  { key: 'roles', title: 'Roles' },
  { key: 'orders', title: 'Orders' },
  { key: 'amazon-credentials', title: 'Amazon Authorisation' },
  { key: 'settings', title: 'Settings' },
];

const emptyPermission = () => ({
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
});

const fullPermission = () => ({
  canView: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
});

const getSectionsByScope = (scope) => {
  if (scope === 'seller') return SELLER_SECTIONS;
  return ADMIN_SECTIONS;
};

const buildFullPermissionMap = (scope) => {
  return getSectionsByScope(scope).reduce((acc, section) => {
    acc[section.key] = fullPermission();
    return acc;
  }, {});
};

const normalizePermissions = (permissions = [], scope = 'admin') => {
  const allowed = new Set(getSectionsByScope(scope).map((s) => s.key));
  const map = {};

  permissions.forEach((item) => {
    if (!item || !item.section || !allowed.has(item.section)) return;
    map[item.section] = {
      canView: Boolean(item.canView),
      canCreate: Boolean(item.canCreate),
      canUpdate: Boolean(item.canUpdate),
      canDelete: Boolean(item.canDelete),
    };
  });

  getSectionsByScope(scope).forEach((section) => {
    if (!map[section.key]) {
      map[section.key] = emptyPermission();
    }
  });

  return map;
};

module.exports = {
  ACTIONS,
  ADMIN_SECTIONS,
  SELLER_SECTIONS,
  emptyPermission,
  fullPermission,
  getSectionsByScope,
  buildFullPermissionMap,
  normalizePermissions,
};
