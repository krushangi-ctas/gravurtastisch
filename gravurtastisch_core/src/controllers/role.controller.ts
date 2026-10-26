const catchAsync = require('../utils/catchAsync');
const roleService = require('../services/role.service');

const getSections = catchAsync(async (req, res) => {
  const { isSellerOwner } = require('../services/permission.service');
  const isAdmin = Boolean(req.user.isSuperAdmin || req.user.userType === 'admin');
  const scope =
    req.query.scope ||
    (isAdmin
      ? 'admin'
      : isSellerOwner(req.user) || req.user.userType === 'seller'
        ? 'seller'
        : 'admin');

  let ownerId = null;
  if (scope === 'seller') {
    if (isAdmin) {
      ownerId = req.query.ownerId || null;
    } else {
      ownerId = isSellerOwner(req.user) ? req.user._id : req.user.parentId;
    }
  }

  const result = await roleService.getSections(scope, ownerId, isAdmin);
  res.status(result.status).send(result);
});

const createRole = catchAsync(async (req, res) => {
  const result = await roleService.createRole(req.user, req.body);
  res.status(result.status).send(result);
});

const listRoles = catchAsync(async (req, res) => {
  const result = await roleService.listRoles(req.user, req.query);
  res.status(result.status).send(result);
});

const getRoleById = catchAsync(async (req, res) => {
  const result = await roleService.getRoleById(req.user, req.params.roleId);
  res.status(result.status).send(result);
});

const updateRole = catchAsync(async (req, res) => {
  const result = await roleService.updateRole(
    req.user,
    req.params.roleId,
    req.body
  );
  res.status(result.status).send(result);
});

const deleteRole = catchAsync(async (req, res) => {
  const result = await roleService.deleteRole(req.user, req.params.roleId);
  res.status(result.status).send(result);
});

module.exports = {
  getSections,
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
