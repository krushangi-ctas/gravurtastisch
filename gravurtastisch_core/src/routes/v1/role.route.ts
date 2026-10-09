const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  requirePermission,
  requireAnyPermission,
} = require('../../middlewares/permission');
const roleValidation = require('../../validations/role.validation');
const roleController = require('../../controllers/role.controller');

const router = express.Router();

router.get(
  '/sections',
  auth(),
  validate(roleValidation.getSections),
  roleController.getSections
);

router
  .route('/')
  .get(
    auth(),
    // Role managers, or anyone who assigns roles while managing users
    requireAnyPermission([
      ['roles', 'view'],
      ['user', 'create'],
      ['user', 'update'],
      ['users', 'create'],
      ['users', 'update'],
      ['sellers', 'create'],
      ['sellers', 'update'],
    ]),
    validate(roleValidation.listRoles),
    roleController.listRoles
  )
  .post(
    auth(),
    requirePermission('roles', 'create'),
    validate(roleValidation.createRole),
    roleController.createRole
  );

router
  .route('/:roleId')
  .get(
    auth(),
    requirePermission('roles', 'view'),
    validate(roleValidation.getRoleById),
    roleController.getRoleById
  )
  .put(
    auth(),
    requirePermission('roles', 'update'),
    validate(roleValidation.updateRole),
    roleController.updateRole
  )
  .delete(
    auth(),
    requirePermission('roles', 'delete'),
    validate(roleValidation.deleteRole),
    roleController.deleteRole
  );

module.exports = router;
