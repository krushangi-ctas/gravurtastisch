const express = require('express');
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../middlewares/permission');
const ordersController = require('../../controllers/order-list.controller');
const validate = require('../../middlewares/validate');
const orderValidation = require('../../validations/order.validation');

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    requirePermission('orders', 'view'),
    validate(orderValidation),
    ordersController.getOrderList
  );

router
  .route('/update-feedback')
  .put(
    auth(),
    requirePermission('orders', 'update'),
    ordersController.updateFeedback
  );

module.exports = router;
