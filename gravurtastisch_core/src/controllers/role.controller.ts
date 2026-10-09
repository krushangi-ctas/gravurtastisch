const catchAsync = require('../utils/catchAsync');
const roleService = require('../services/role.service');

const getSections = catchAsync(async (req, res) => {
  const { isSellerOwner } = require('../services/permission.service');
  const scope =
    req.query.scope ||
    (req.user.isSuperAdmin || req.user.userType === 'admin'
      ? 'admin'
      : isSellerOwner(req.user) || req.user.userType === 'seller'
        ? 'seller'
        : 'admin');
  const result = await roleService.getSections(scope);
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
