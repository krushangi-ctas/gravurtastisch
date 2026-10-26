// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { requireAnyPermission } = require('../../middlewares/permission');
const generalSettingController = require('../../controllers/generalSetting.controller');

router.put(
  '/update-setting',
  auth(),
  requireAnyPermission([
    ['/settings/generalsetting', 'update'],
    ['/settings', 'update'],
    ['settings', 'update'],
  ]),
  generalSettingController.updateGeneralSetting
);

router.get('/', auth(), generalSettingController.getGeneralSetting);

module.exports = router;
