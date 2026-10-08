const catchAsync = require('../utils/catchAsync');
const ordersService = require('../services/orders.service');
const pick = require('../utils/pick');
const { resolveSellerOwnerId } = require('../services/permission.service');

const getOrderList = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'from', 'to', 'marketplaceId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
  // Team users inherit the sellerAdmin owner's orders
  const ownerId = resolveSellerOwnerId(req.user);
  const { status, message, data, pagination } =
    await ordersService.getOrderList(filter, options, ownerId);
  res.status(status).send({ status, message, data, pagination });
});

const updateFeedback = catchAsync(async (req, res) => {
  const ownerId = resolveSellerOwnerId(req.user);
  const { status, message, data } = await ordersService.updateFeedback(
    req.body,
    ownerId
  );
  res.status(status).send({ status, message, data });
});

module.exports = {
  getOrderList,
  updateFeedback,
};
