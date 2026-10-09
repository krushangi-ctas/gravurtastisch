const catchAsync = require('../utils/catchAsync');
const commonService = require('../services/common.service');
const IpModel = require('../models/ip.model');
const pick = require('../utils/pick');
const httpStatus = require('http-status');
/**
 * Add IP
 */

const addIp = catchAsync(async (req, res) => {
  try {
    const { status, message, data } = await commonService.add(
      req.body,
      req.params.userId,
      IpModel,
      'IP already exists.',
      'create-ip'
    );

    res.status(status).send({ status, message, data });
  } catch (error) {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Invalid data format', error: error.message });
  }
});

/**
 * Get IP List
 */
const getIpList = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Ensure you destructure `status`, `message`, and `data`
  const { status, message, data, pagination } = await commonService.getList(
    filter,
    options,
    IpModel,
    ['ip']
  );

  res.status(status).send({ status, message, data, pagination });
});

/**
 * Get IP by ID
 */
const getIpById = catchAsync(async (req, res) => {
  const { status, message, data } = await commonService.getById(
    req.params.id,
    IpModel
  );
  res.status(status).send({ status, message, data });
});

/**
 * Update IP by ID
 */
const updateIpById = catchAsync(async (req, res) => {
  const { status, message, data } = await commonService.uniqueUpdateById(
    req.params.id,
    req.params.userId,
    req.body,
    IpModel,
    'IP already exist.',
    'update-ip',
    'delete-ip'
  );
  res.status(status).send({ status, message, data });
});

module.exports = { addIp, getIpList, getIpById, updateIpById };
