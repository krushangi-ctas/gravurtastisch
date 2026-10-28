// @ts-nocheck
const httpStatus = require('http-status');
const Role = require('../models/role.model');
const Section = require('../models/section.model');
const User = require('../models/user.model');
const { createResponse } = require('./common.service');
const errorHandler = require('../utils/error.handler');
const { systemLog } = require('../utils/system-log');
const {
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

const getSections = async (scope = 'admin', ownerId = null, isAdmin = false) => {
  try {
    const filter = {
      scope,
      status: 1,
    };
    if (scope === 'seller') {
      if (ownerId) {
        filter.$or = [{ ownerId }, { ownerId: null }];
      }
    }

    const sections = await Section.find(filter).sort({ createdAt: 1 }).lean();
    const seen = new Set();
    const formatted = [];

    for (const s of sections) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        formatted.push({
          id: String(s._id),
          key: s.name,
          name: s.name,
          title: s.title,
          status: s.status !== undefined ? s.status : 1,
          permissions: s.permissions || { add: true, update: true, delete: true, view: true },
        });
      }
    }

    return createResponse(
      httpStatus.OK,
      'Sections fetched',
      formatted
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'get-sections', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const buildSectionList = async (scope, ownerId, incomingPermissions = [], incomingSectionList = []) => {
  const filter = {
    scope,
    status: 1,
  };
  if (scope === 'seller') {
    if (ownerId) {
      filter.$or = [{ ownerId }, { ownerId: null }];
    }
  }

  const sections = await Section.find(filter).sort({ createdAt: 1 }).lean();

  const permMap = {};
  if (Array.isArray(incomingPermissions)) {
    incomingPermissions.forEach((p) => {
      if (!p || !p.section) return;
      permMap[p.section] = {
        view: Boolean(p.canView !== undefined ? p.canView : p.view),
        add: Boolean(p.canCreate !== undefined ? p.canCreate : p.add),
        update: Boolean(p.canUpdate !== undefined ? p.canUpdate : p.update),
        delete: Boolean(p.canDelete !== undefined ? p.canDelete : p.delete),
      };
    });
  }

  if (Array.isArray(incomingSectionList)) {
    incomingSectionList.forEach((s) => {
      if (!s || !s.name) return;
      permMap[s.name] = {
        view: Boolean(s.permissions?.view),
        add: Boolean(s.permissions?.add),
        update: Boolean(s.permissions?.update),
        delete: Boolean(s.permissions?.delete),
      };
    });
  }

  const sectionList = sections.map((sec) => {
    const secName = sec.name;
    const clean = secName.replace(/^\//, '');
    const flags =
      permMap[secName] ||
      permMap[`/${clean}`] ||
      permMap[clean] ||
      (clean === 'user' ? permMap['/users'] || permMap['users'] : null) ||
      (clean === 'users' ? permMap['/admin-users'] || permMap['admin-users'] || permMap['user'] : null) ||
      { view: false, add: false, update: false, delete: false };

    const isAccessable = Boolean(flags.view || flags.add || flags.update || flags.delete);

    return {
      id: String(sec._id || sec.id),
      name: sec.name,
      title: sec.title,
      status: sec.status !== undefined ? sec.status : 1,
      permissions: {
        add: flags.add,
        delete: flags.delete,
        update: flags.update,
        view: flags.view,
      },
      isAccessable,
    };
  });

  return sectionList;
};

const createRole = async (actor, body) => {
  try {
    const scope = body.scope || (actor.isSellerAdmin ? 'seller' : 'admin');
    if (!assertScopeAccess(actor, scope)) {
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to create roles for this scope'
      );
    }

    const ownerId = resolveOwnerId(actor, scope);
    if (scope === 'seller' && !ownerId) {
      return createResponse(
        httpStatus.FORBIDDEN,
        'Only seller admins have permission to create seller roles'
      );
    }

    const roleName = String(body.name || body.role_name || '').trim();
    const existing = await Role.findOne({
      $or: [{ role_name: roleName }, { name: roleName }],
      scope,
      ownerId: ownerId || null,
      status: { $ne: 2 },
    });
    if (existing) {
      return createResponse(httpStatus.CONFLICT, 'Role name already exists');
    }

    const sectionList = await buildSectionList(scope, ownerId, body.permissions, body.section_list);
    const legacyPermissions = sectionList.map((s) => ({
      section: s.name,
      canView: s.permissions.view,
      canCreate: s.permissions.add,
      canUpdate: s.permissions.update,
      canDelete: s.permissions.delete,
    }));

    const role = await Role.create({
      name: roleName,
      role_name: roleName,
      description: body.description || '',
      scope,
      ownerId,
      section_list: sectionList,
      permissions: legacyPermissions,
      status: 1,
      isSystem: false,
    });

    await systemLog(
      'CREATE',
      role.toObject ? role.toObject() : role,
      actor._id,
      'create-role',
      {},
      role.scope
    );

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
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to view roles for this scope'
      );
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
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to view this role'
      );
    }

    if (role.scope === 'seller') {
      const ownerId = resolveOwnerId(actor, 'seller');
      if (String(role.ownerId) !== String(ownerId) && !actor.isSuperAdmin) {
        return createResponse(
          httpStatus.FORBIDDEN,
          'You do not have permission to view roles belonging to another organization'
        );
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
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to modify this role'
      );
    }
    if (role.scope === 'seller') {
      const ownerId = resolveOwnerId(actor, 'seller');
      if (String(role.ownerId) !== String(ownerId) && !actor.isSuperAdmin) {
        return createResponse(
          httpStatus.FORBIDDEN,
          'You do not have permission to modify roles belonging to another organization'
        );
      }
    }

    const existingData = role.toObject
      ? role.toObject()
      : JSON.parse(JSON.stringify(role));

    if (body.name || body.role_name) {
      const roleName = String(body.name || body.role_name).trim();
      role.name = roleName;
      role.role_name = roleName;
    }
    if (body.description !== undefined) role.description = body.description;
    if (body.status !== undefined) role.status = body.status;
    if (body.permissions || body.section_list) {
      const sectionList = await buildSectionList(
        role.scope,
        role.ownerId,
        body.permissions || [],
        body.section_list || []
      );
      role.section_list = sectionList;
      role.permissions = sectionList.map((s) => ({
        section: s.name,
        canView: s.permissions.view,
        canCreate: s.permissions.add,
        canUpdate: s.permissions.update,
        canDelete: s.permissions.delete,
      }));
    }

    await role.save();

    await systemLog(
      'UPDATE',
      role.toObject ? role.toObject() : role,
      actor._id,
      'update-role',
      existingData,
      role.scope
    );

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
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to delete this role'
      );
    }
    if (role.scope === 'seller') {
      const ownerId = resolveOwnerId(actor, 'seller');
      if (String(role.ownerId) !== String(ownerId) && !actor.isSuperAdmin) {
        return createResponse(
          httpStatus.FORBIDDEN,
          'You do not have permission to delete roles belonging to another organization'
        );
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

    await systemLog(
      'DELETE',
      role.toObject ? role.toObject() : role,
      actor._id,
      'delete-role',
      {},
      role.scope
    );

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
