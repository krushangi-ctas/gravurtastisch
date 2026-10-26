/**
 * Permission utilities for dynamic sections.
 * Static constants for sections are removed in favor of direct tbl_sections DB queries.
 */

const ACTIONS = ['canView', 'canCreate', 'canUpdate', 'canDelete'];

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

const normalizePermissions = (permissions = []) => {
  const map = {};

  permissions.forEach((item) => {
    if (!item || !item.section) return;
    map[item.section] = {
      canView: Boolean(item.canView || item.view),
      canCreate: Boolean(item.canCreate || item.add),
      canUpdate: Boolean(item.canUpdate || item.update),
      canDelete: Boolean(item.canDelete || item.delete),
    };
  });

  return map;
};

module.exports = {
  ACTIONS,
  emptyPermission,
  fullPermission,
  normalizePermissions,
};
