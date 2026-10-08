const catchAsync = require('../utils/catchAsync');
const ordersService = require('../services/orders.service');
const pick = require('../utils/pick');
const {
  formatDate,
  formatCurrency,
  formatOrderItems,
  getStatusClass,
  buildSearchUrl,
} = require('../utils/templateHelpers');

const renderSearchPage = catchAsync(async (req, res) => {
  // Handle date parameters from form
  const searchParams = { ...req.query };
  if (req.query['date[from]']) {
    searchParams.date = { from: req.query['date[from]'] };
  }
  if (req.query['date[to]']) {
    searchParams.date = { ...searchParams.date, to: req.query['date[to]'] };
  }

  const filter = pick(searchParams, ['search', 'date']);
  const options = pick(searchParams, ['sortBy', 'limit', 'page']);

  // Set default values
  // const page = parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  // const limit =
  //   parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;

  try {
    const { status, message, data, pagination } =
      await ordersService.getOrderList(filter, options);

    if (status !== 200) {
      return res.render('search', {
        orders: [],
        pagination: null,
        searchParams: req.query,
        error: message || 'Failed to fetch orders',
        title: 'Order Search',
        formatDate,
        formatCurrency,
        formatOrderItems,
        getStatusClass,
        buildSearchUrl: (page) => buildSearchUrl(req.url, page),
      });
    }

    res.render('search', {
      orders: data || [],
      pagination: pagination || {},
      searchParams: req.query,
      error: null,
      title: 'Order Search',
      formatDate,
      formatCurrency,
      formatOrderItems,
      getStatusClass,
      buildSearchUrl: (page) => buildSearchUrl(req.url, page),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.render('search', {
      orders: [],
      pagination: null,
      searchParams: req.query,
      error: 'An error occurred while searching orders',
      title: 'Order Search',
      formatDate,
      formatCurrency,
      formatOrderItems,
      getStatusClass,
      buildSearchUrl: (page) => buildSearchUrl(req.url, page),
    });
  }
});

const searchOrders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'date']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const { status, message, data, pagination } =
    await ordersService.getOrderList(filter, options);

  if (status !== 200) {
    return res.status(status).json({
      success: false,
      message: message || 'Failed to fetch orders',
      data: [],
      pagination: null,
    });
  }

  res.status(status).json({
    success: true,
    message: 'Orders fetched successfully',
    data: data || [],
    pagination: pagination || {},
  });
});

module.exports = {
  renderSearchPage,
  searchOrders,
};
