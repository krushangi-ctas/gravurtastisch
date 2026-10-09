const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const requirePermission = require('../../middlewares/permission');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const User = require('../../models/user.model');
const {
  enrichUserWithPermissions,
  isSellerOwner,
} = require('../../services/permission.service');
const multipart = require('connect-multiparty');

const router = express.Router();

router.post(
  '/register-seller',
  validate(userValidation.registerSeller),
  userController.registerSeller
);

const multipartMiddleware = multipart({
  uploadDir: `${__dirname}/../../uploads`,
});

router.route('/sign-in-with-token').get(auth(), async (req, res, next) => {
  try {
    const enriched = await enrichUserWithPermissions(req.user);
    return res.status(200).send(enriched);
  } catch (error) {
    return next(error);
  }
});

router
  .route('/')
  .post(
    auth(),
    requirePermission('users', 'create'),
    validate(userValidation.createUser),
    userController.createManagedUser
  )
  .get(auth(), userController.getUser);

router.post(
  '/team',
  auth(),
  requirePermission('user', 'create'),
  validate(userValidation.createTeamUser),
  userController.createManagedUser
);

router.get(
  '/team',
  auth(),
  requirePermission('user', 'view'),
  validate(userValidation.getUsers),
  userController.getTeamUsers
);

router
  .route('/upload-image')
  .post(auth(), multipartMiddleware, userController.uploadProfile);

router.get(
  '/sellers',
  auth(),
  requirePermission('sellers', 'view'),
  validate(userValidation.getUsers),
  userController.getAdminSellers
);

router.get(
  '/admin-staff',
  auth(),
  requirePermission('users', 'view'),
  validate(userValidation.getUsers),
  userController.getAdminStaffUsers
);

router.put(
  '/admin-update/:userId',
  auth(),
  async (req, res, next) => {
    try {
      const target = await User.findById(req.params.userId)
        .select('userType isSellerAdmin parentId isSuperAdmin')
        .lean();

      if (target?.isSuperAdmin) {
        return requirePermission('users', 'update')(req, res, next);
      }

      if (isSellerOwner(req.user) || req.user.userType === 'seller') {
        return requirePermission('user', 'update')(req, res, next);
      }

      let section = 'users';
      const isSellerTarget =
        target?.userType === 'seller' ||
        target?.isSellerAdmin ||
        (!target?.parentId && target?.userType !== 'admin');
      if (isSellerTarget) {
        section = 'sellers';
      }

      const action = req.body?.status === 2 ? 'delete' : 'update';
      return requirePermission(section, action)(req, res, next);
    } catch (error) {
      return next(error);
    }
  },
  userController.adminUpdateUser
);

router.get('/get-chats/:userId', auth(), userController.getUserForChat);

router.put('/update-profile', auth(), userController.updateUser);
router.put('/update-password', auth(), userController.updateUserPassword);

router.post(
  '/:userId/:loginId',
  auth(),
  validate(userValidation.deleteUser),
  userController.deleteUser
);

router.route('/profile/delete-image').post(auth(), userController.deleteProfile);

module.exports = router;
