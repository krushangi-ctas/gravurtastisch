// @ts-nocheck
const httpStatus = require('http-status');
const Role = require('../models/role.model');
const User = require('../models/user.model');
const { createResponse } = require('./common.service');
const errorHandler = require('../utils/error.handler');
const {
  getSectionsByScope,
  normalizePermissions,
} = require('../config/sections');

const permissionsToArray = (permissionMap) =>
  Object.entries(permissionMap || {}).map(([section, flags]) => ({
    section,
    canView: Boolean(flags.canView),
    canCreate: Boolean(flags.canCreate),
    canUpdate: Boolean(flags.canUpdate),
    canDelete: Boolean(flags.canDelete),
  }));

const { isSellerOwner } = require('./permission.service');

const assertScopeAccess = (actor, scope) => {
  if (actor.isSuperAdmin) return true;
  if (scope === 'admin') {
    return actor.userType === 'admin';
  }
  if (scope === 'seller') {
    return Boolean(isSellerOwner(actor) || actor.userType === 'seller');
  }
  return false;
};

const resolveOwnerId = (actor, scope) => {
  if (scope === 'admin') return null;
  if (isSellerOwner(actor)) return actor._id;
  return actor.parentId || null;
};

const getSections = (scope = 'admin') => {
  return createResponse(
    httpStatus.OK,
    'Sections fetched',
    getSectionsByScope(scope)
  );
};

const createRole = async (actor, body) => {
  try {
    const scope = body.scope || (actor.isSellerAdmin ? 'seller' : 'admin');
    if (!assertScopeAccess(actor, scope)) {
      return createResponse(httpStatus.FORBIDDEN, 'Cannot create roles for this scope');
    }

    const ownerId = resolveOwnerId(actor, scope);
    if (scope === 'seller' && !ownerId) {
      return createResponse(
        httpStatus.FORBIDDEN,
        'Only seller admins can create seller roles'
      );
    }

    const permissionMap = normalizePermissions(body.permissions || [], scope);
    const existing = await Role.findOne({
      role_name: body.role_name.trim(),
      scope,
      ownerId: ownerId || null,
      status: { $ne: 2 },
    });
    if (existing) {
      return createResponse(httpStatus.CONFLICT, 'Role name already exists');
    }

    const role = await Role.create({
      role_name: body.role_name.trim(),
      description: body.description || '',
      scope,
      ownerId,
      permissions: permissionsToArray(permissionMap),
      status: 1,
      isSystem: false,
    });

    return createResponse(httpStatus.OK, 'Role created', role);
  } catch (error) {
    errorHandler.errorM({ action_type: 'create-role', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const listRoles = async (actor, query = {}) => {
  try {
    const scope =
      query.scope ||
      (actor.isSuperAdmin || actor.userType === 'admin' ? 'admin' : 'seller');

    if (!assertScopeAccess(actor, scope)) {
      return createResponse(httpStatus.FORBIDDEN, 'Cannot list roles for this scope');
    }

    const filter = {
      scope,
      status: { $ne: 2 },
    };

    if (scope === 'seller') {
      const ownerId = resolveOwnerId(actor, scope);
      filter.ownerId = ownerId;
    } else {
      filter.ownerId = null;
    }

    if (query.search) {
      filter.role_name = { $regex: query.search, $options: 'i' };
    }

    const options = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 50,
      sortBy: query.sortBy || 'createdAt:desc',
    };

    const result = await Role.paginate(filter, options, ['role_name', 'description']);
    return createResponse(httpStatus.OK, 'Roles fetched', result.results, {
      pagination: result.pagination,
    });
  } catch (error) {
    errorHandler.errorM({ action_type: 'list-roles', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const getRoleById = async (actor, roleId) => {
  try {
    const role = await Role.findOne({ _id: roleId, status: { $ne: 2 } });
    if (!role) {
      return createResponse(httpStatus.NOT_FOUND, 'Role not found');
    }

    if (!assertScopeAccess(actor, role.scope)) {
      return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
    }

    if (role.scope === 'seller') {
      const ownerId = resolveOwnerId(actor, 'seller');
      if (String(role.ownerId) !== String(ownerId) && !actor.isSuperAdmin) {
        return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
      }
    }

    return createResponse(httpStatus.OK, 'Role fetched', role);
  } catch (error) {
    errorHandler.errorM({ action_type: 'get-role', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const updateRole = async (actor, roleId, body) => {
  try {
    const role = await Role.findOne({ _id: roleId, status: { $ne: 2 } });
    if (!role) {
      return createResponse(httpStatus.NOT_FOUND, 'Role not found');
    }
    if (role.isSystem) {
      return createResponse(httpStatus.FORBIDDEN, 'System roles cannot be modified');
    }
    if (!assertScopeAccess(actor, role.scope)) {
      return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
    }
    if (role.scope === 'seller') {
      const ownerId = resolveOwnerId(actor, 'seller');
      if (String(role.ownerId) !== String(ownerId) && !actor.isSuperAdmin) {
        return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
      }
    }

    if (body.role_name) role.role_name = body.role_name.trim();
    if (body.description !== undefined) role.description = body.description;
    if (body.status !== undefined) role.status = body.status;
    if (body.permissions) {
      const map = normalizePermissions(body.permissions, role.scope);
      role.permissions = permissionsToArray(map);
    }

    await role.save();
    return createResponse(httpStatus.OK, 'Role updated', role);
  } catch (error) {
    errorHandler.errorM({ action_type: 'update-role', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const deleteRole = async (actor, roleId) => {
  try {
    const role = await Role.findOne({ _id: roleId, status: { $ne: 2 } });
    if (!role) {
      return createResponse(httpStatus.NOT_FOUND, 'Role not found');
    }
    if (role.isSystem) {
      return createResponse(httpStatus.FORBIDDEN, 'System roles cannot be deleted');
    }
    if (!assertScopeAccess(actor, role.scope)) {
      return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
    }
    if (role.scope === 'seller') {
      const ownerId = resolveOwnerId(actor, 'seller');
      if (String(role.ownerId) !== String(ownerId) && !actor.isSuperAdmin) {
        return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
      }
    }

    const assignedCount = await User.countDocuments({
      role_id: role._id,
      status: { $ne: 2 },
    });
    if (assignedCount > 0) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'Role is assigned to users. Reassign users before deleting.'
      );
    }

    role.status = 2;
    await role.save();
    return createResponse(httpStatus.OK, 'Role deleted', {});
  } catch (error) {
    errorHandler.errorM({ action_type: 'delete-role', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  getSections,
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
