// @ts-nocheck
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const errorHandler = require('../utils/error.handler');
const { systemLog } = require('../utils/system-log');
const { escapeRegex, orderItemStatus } = require('../config/constants');
const AmzInInventoriesModel = require('../models/amz-in-inventories.model');
const db = mongoose.connection;

const create = async (
  bodyData,
  userId,
  Model,
  key,
  existingDataKey,
  error_action_type = 'CREATE'
) => {
  try {
    if (existingDataKey && existingDataKey.key.length > 0) {
      // Build dynamic query for multiple field checks
      let query = { status: { $ne: 2 } };
      if (existingDataKey.opr === 'OR') {
        query.$or = [];
        existingDataKey.key.forEach((field) => {
          const value = bodyData[field].trim();
          if (mongoose.isValidObjectId(value)) {
            query.$or.push({ [field]: new mongoose.Types.ObjectId(value) });
          } else {
            query.$or.push({
              [field]:
                typeof value === 'string'
                  ? { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') }
                  : value,
            });
          }
        });
      } else {
        existingDataKey.key.forEach((field) => {
          const value = bodyData[field].trim();
          if (mongoose.isValidObjectId(value)) {
            query[field] = new mongoose.Types.ObjectId(value);
          } else {
            query[field] =
              typeof value === 'string'
                ? { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') }
                : value;
          }
        });
      }

      // Check if any record exists with given conditions
      const existingData = await Model.findOne(query);
      if (existingData) {
        return createResponse(
          httpStatus.BAD_REQUEST,
          `${existingDataKey.messageKey} already exists.`
        );
      }
    }
    const data = await Model.create(bodyData);
    await systemLog('CREATE', data, userId, key);
    return createResponse(httpStatus.OK, ' Created.', data);
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return createResponse(
      httpStatus.BAD_REQUEST,
      error.message || 'Something Went Wrong.'
    );
  }
};

const getById = async (id, Model) => {
  try {
    const data = await Model.findById(id);

    if (!data) {
      return createResponse(httpStatus.NOT_FOUND, 'Store Detail Not Found.');
    }
    return createResponse(httpStatus.OK, 'Get Details.', data);
  } catch (error) {
    return createResponse(httpStatus.BAD_REQUEST, 'Something Went Wrong.');
  }
};

const updateById = async (
  id,
  userId,
  bodyData,
  Model,
  updateKey,
  deleteKey,
  existingDataKey = { key: [] }
) => {
  const existingData = await Model.findById(id);
  if (!existingData) {
    return createResponse(httpStatus.NOT_FOUND, 'Country not found.');
  }
  try {
    if (
      ![0, 1, 2].includes(parseInt(bodyData.status)) &&
      existingDataKey &&
      existingDataKey?.key?.length > 0
    ) {
      // Build dynamic query for multiple field checks
      let query = {
        status: { $ne: 2 },
        _id: { $ne: mongoose.Types.ObjectId(id) },
      };
      if (existingDataKey.opr === 'OR') {
        query.$or = [];
        existingDataKey.key.forEach((field) => {
          const value = bodyData[field];
          if (typeof value === 'string') {
            const trimmedVal = value.trim();
            if (mongoose.isValidObjectId(trimmedVal)) {
              query.$or.push({
                [field]: new mongoose.Types.ObjectId(trimmedVal),
              });
            } else {
              query.$or.push({
                [field]: {
                  $regex: new RegExp(`^${escapeRegex(trimmedVal)}$`, 'i'),
                },
              });
            }
          } else if (mongoose.isValidObjectId(value)) {
            query.$or.push({ [field]: new mongoose.Types.ObjectId(value) });
          } else {
            query.$or.push({ [field]: value });
          }
        });
      } else {
        existingDataKey.key.forEach((field) => {
          const value = bodyData[field];
          if (typeof value === 'string') {
            const trimmedVal = value.trim();
            if (mongoose.isValidObjectId(trimmedVal)) {
              query[field] = new mongoose.Types.ObjectId(trimmedVal);
            } else {
              query[field] = {
                $regex: new RegExp(`^${escapeRegex(trimmedVal)}$`, 'i'),
              };
            }
          } else if (mongoose.isValidObjectId(value)) {
            query[field] = new mongoose.Types.ObjectId(value);
          } else {
            query[field] = value;
          }
        });
      }
      // Check if any record exists with given conditions
      const existingCheckData = await Model.findOne(query);
      if (existingCheckData) {
        return createResponse(
          httpStatus.BAD_REQUEST,
          `${existingDataKey?.messageKey} already exists.`
        );
      }
    }

    // Ensure update happens and returns the new data
    const updatedData = await Model.findByIdAndUpdate(id, bodyData, {
      new: true,
      runValidators: true,
    });

    if (!updatedData) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'Update failed. No changes were made.'
      );
    }

    // Log the update action
    if (parseInt(bodyData.status) === 2) {
      await systemLog('DELETE', existingData, userId, deleteKey);
    } else {
      await systemLog('UPDATE', bodyData, userId, updateKey, existingData);
    }

    return createResponse(httpStatus.OK, 'Updated successfully', updatedData);
  } catch (error) {
    errorHandler.errorM({
      action_type: existingDataKey?.messageKey
        ? `update-${existingDataKey?.messageKey}`
        : 'update',
      error_data: error,
    });

    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const getList = async (
  bodyData,
  filter,
  options,
  Model,
  searchFields,
  error_action_type = 'get-common-list'
) => {
  try {
    const data = await Model.paginate(bodyData, options, searchFields, filter);
    return createResponse(
      httpStatus.OK,
      'List fetched successfully.',
      data.results,
      { pagination: data.pagination }
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return createResponse(httpStatus.BAD_REQUEST, error.message); // Fixed syntax
  }
};

/**
 * Fetches a list of documents from a given Mongoose model with optional population.
 * @param {Object} query - Query parameters.
 * @param {Object} query.fields - Fields to filter documents.
 * @param {Object} [query.projection] - Projection to select specific fields.
 * @param {import("mongoose").Model} Model - Mongoose model to query.
 * @param {string} [error_action_type="get-f-details-list"] - Action type for error logging.
 * @param {boolean | string[] | Object[]} [populate=false] - Fields to populate (array of strings or objects).
 * @returns {Promise<{status: number, message: string, data?: Array<Object>}>} - Response object.
 */
const getAllList = async (
  options,
  query,
  Model,
  error_action_type = 'get-details-list',
  populate = false
) => {
  try {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let queryExec = Model.find(query.fields, query.projection)
      .sort(query.sort)
      .skip(skip)
      .limit(limit);

    // Apply population if specified
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((field) => {
          queryExec = queryExec?.populate(field);
        });
      } else if (typeof populate === 'object') {
        queryExec = queryExec?.populate(populate);
      }
    }

    const data = await queryExec.exec();
    const totalCount = await Model.countDocuments(query.fields);
    return {
      status: httpStatus.OK,
      message: 'Success',
      data: {
        items: data,
        pagination: {
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return { status: httpStatus.BAD_REQUEST, message: error.message };
  }
};

const add = async (
  bodyData,
  userId,
  Model,
  message,
  key,
  error_action_type = 'add-common'
) => {
  try {
    const data = await Model.find({
      ...bodyData,
      status: { $ne: 2 },
    });
    if (data.length > 0) {
      return createResponse(httpStatus.BAD_REQUEST, message);
    }

    if (data && data.mode_name && data.mode_name.length > 55) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'Mode name cannot exceed 55 characters'
      );
    }

    const add = await Model.create(bodyData);
    await systemLog('CREATE', add, userId, key);
    return createResponse(httpStatus.OK, 'Created', data);
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * @typedef {Object} Message
 * @property {string} ERROR
 * @property {string} OK
 * @property {string} BAD_REQUEST
 *
 * @param {Object<any>} uniqueField
 * @param {Object<any>} bodyData
 * @param {string} userId
 * @param {Object<any>} Model
 * @param {Message|string} message
 * @param {string} key
 * @param {string} error_action_type
 * @returns {Promise<any>}
 */
const uniqueAdd = async (
  uniqueField,
  bodyData,
  userId,
  Model,
  message,
  key,
  error_action_type = 'add-common'
) => {
  try {
    const data = await Model.find({
      ...uniqueField,
      status: { $ne: 2 },
    });
    if (data.length > 0) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        message?.BAD_REQUEST
          ? message.BAD_REQUEST
          : typeof message === 'string'
          ? message
          : 'Record alredy exist'
      );
    }

    if (
      bodyData &&
      bodyData.code_remarks &&
      bodyData.code_remarks.length > 80
    ) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'code remarks cannot exceed 80 characters'
      );
    }

    const add = await Model.create(bodyData);
    await systemLog('CREATE', add, userId, key);
    return createResponse(
      httpStatus.OK,
      message?.OK
        ? message.OK
        : typeof message === 'string'
        ? message
        : 'Record added sucessfully',
      data
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      message?.ERROR ? message.ERROR : error.message
    );
  }
};

const uniqueUpdateById = async (
  id,
  userId,
  bodyData,
  Model,
  message,
  updateKey,
  deleteKey,
  error_action_type = 'update-common'
) => {
  if (
    parseInt(bodyData.status) != 2 &&
    parseInt(bodyData.status) != 0 &&
    parseInt(bodyData.status) != 1
  ) {
    const data = await Model.find({
      ...bodyData,
      _id: { $ne: id },
      status: { $ne: 2 },
    });
    if (data.length > 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: message,
      };
    }
  }
  const existingData = await Model.findById(id);

  try {
    const data = await Model.findByIdAndUpdate(id, bodyData);
    if (parseInt(bodyData.status) === 2) {
      await systemLog('DELETE', existingData, userId, deleteKey);
    } else {
      await systemLog('UPDATE', bodyData, userId, updateKey, existingData);
    }
    return {
      status: httpStatus.OK,
      message: 'Updated successfully.',
      data: data,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: message?.ERROR ? message.ERROR : 'Something went wrong',
      data: {},
    };
  }
};

/**
 * @typedef {Object} Message
 * @property {string} ERROR
 * @property {string} OK
 * @property {string} BAD_REQUEST
 *
 * @param {Object<any>} query
 * @param {string} id
 * @param {Object<any>} bodyData
 * @param {string} userId
 * @param {Object<any>} Model
 * @param {Message|string} message
 * @param {string} updateKey
 * @param {string} deleteKey
 * @param {string} error_action_type
 * @returns {Promise<any>}
 */
const uniqueQueryBasedUpdateById = async (
  query,
  id,
  userId,
  bodyData,
  Model,
  message,
  updateKey,
  deleteKey,
  error_action_type = 'update-common'
) => {
  if (
    parseInt(bodyData.status) != 2 &&
    parseInt(bodyData.status) != 0 &&
    parseInt(bodyData.status) != 1
  ) {
    const data = await Model.find({
      ...query,
      _id: { $ne: id },
      status: { $ne: 2 },
    });
    if (data.length > 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: message?.BAD_REQUEST
          ? message.BAD_REQUEST
          : typeof message === 'string'
          ? message
          : 'Record alredy exist',
      };
    }
  }
  const existingData = await Model.findById(id);

  try {
    const data = await Model.findByIdAndUpdate(id, bodyData);
    if (parseInt(bodyData.status) === 2) {
      await systemLog('DELETE', existingData, userId, deleteKey);
    } else {
      await systemLog('UPDATE', bodyData, userId, updateKey, existingData);
    }
    return {
      status: httpStatus.OK,
      message: message?.OK
        ? message.OK
        : typeof message === 'string'
        ? message
        : 'Record updated sucessfully',
      data: data,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: error_action_type,
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
      data: {},
    };
  }
};

const createResponse = (
  status = httpStatus.INTERNAL_SERVER_ERROR,
  message = 'Something went wrong!',
  data = {}, // Optional data (data or other fields)
  extraFields = {} // Additional dynamic fields
) => {
  if (status && Array.isArray(status) && status.length === 0) {
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message,
      ...(data && { data: [] }), // Include `payload` only if it's provided
    };
  }
  return {
    status,
    message,
    ...(data && { data }), // Include `payload` only if it's provided
    ...extraFields, // Spread any additional fields dynamically
  };
};

/**
 * @typedef {Object} Filter
 * @property {number} status
 * @property {string} search
 */
/**
 * Generate Common Search Feilds For aggregation Pipeline
 * @param {Object} args
 * @param {Filter} args.filter
 * @param {Object} [args.options]
 * @param {Array} [args.searchConditions]
 * @param {Array<string>} [args.searchFeilds]
 * @returns {Array}
 */
const commonSearchFields = (args) => {
  const { filter = {}, searchConditions = [], searchFeilds = [] } = args;
  try {
    if (filter.status !== undefined) {
      const status = parseInt(filter.status, 10);
      if ([0, 1].includes(status)) {
        searchConditions.push({ status });
      } else {
        searchConditions.push({ status: { $ne: 2 } }); // Exclude deleted records
      }
    } else {
      searchConditions.push({ status: { $ne: 2 } }); // Default to excluding deleted
    }
    // Handle search functionality
    if (filter.search) {
      const escapedSearch = escapeRegex(filter.search.toString().trim());
      const searchRegex = new RegExp(escapedSearch, 'i');

      // const searchRegex = new RegExp(
      //   filter?.search?.toString()?.trim() || "",
      //   "i"
      // ); // Case-insensitive search

      searchConditions.push({
        $or: [
          ...(searchFeilds.length > 0
            ? searchFeilds.map((elem) => ({ [elem]: searchRegex }))
            : []),
        ],
      });
    }
    return searchConditions;
  } catch (err) {
    return [{}];
  }
};

const categories = [
  { category: 'Baby Products', is_adc: 'ADC' },
  { category: 'Electronics', is_adc: 'NON-ADC' },
  { category: 'Beauty & Personal Care', is_adc: 'ADC' },
  { category: 'Sports & Outdoors', is_adc: 'NON-ADC' },
  { category: 'Health & Household', is_adc: 'ADC' },
  { category: 'Tools & Home Improvement', is_adc: 'NON-ADC' },
  { category: 'Toys & Games', is_adc: 'NON-ADC' },
  { category: 'Pet Supplies', is_adc: 'ADC' },
  { category: 'Home & Kitchen', is_adc: 'NON-ADC' },
  { category: 'Office Products', is_adc: 'NON-ADC' },
  { category: 'Industrial & Scientific', is_adc: 'NON-ADC' },
  { category: 'Car & Motorbike', is_adc: 'NON-ADC' },
  { category: 'Musical Instruments', is_adc: 'NON-ADC' },
  { category: 'Clothing, Shoes & Jewelry', is_adc: 'NON-ADC' },
  { category: 'Video Games', is_adc: 'NON-ADC' },
  { category: 'Arts, Crafts & Sewing', is_adc: 'NON-ADC' },
  { category: 'Grocery & Gourmet Food', is_adc: 'NON-ADC' },
  { category: 'Automotive', is_adc: 'NON-ADC' },
  { category: 'Books', is_adc: 'NON-ADC' },
  { category: 'Patio, Lawn & Garden', is_adc: 'NON-ADC' },
  { category: 'Movies & TV', is_adc: 'NON-ADC' },
  { category: 'Outdoor Living', is_adc: 'NON-ADC' },
  { category: 'Computers & Accessories', is_adc: 'NON-ADC' },
  { category: 'Shoes & Handbags', is_adc: 'NON-ADC' },
  { category: 'Watches', is_adc: 'NON-ADC' },
  { category: 'Health & Personal Care', is_adc: 'ADC' },
  { category: 'Jewellery', is_adc: 'NON-ADC' },
  { category: 'Appliances', is_adc: 'NON-ADC' },
  { category: 'Bags, Wallets and Luggage', is_adc: 'NON-ADC' },
  { category: 'Cell Phones & Accessories', is_adc: 'AB' },
  { category: 'Clothing & Accessories', is_adc: 'NON-ADC' },
  { category: 'Home Improvement', is_adc: 'NON-ADC' },
  { category: 'Sports, Fitness & Outdoors', is_adc: 'NON-ADC' },
];

//Update amz stock
const updateAmzStock = async (sku, stock) => {
  await AmzInInventoriesModel.findOneAndUpdate(
    { sku, status: { $ne: 2 } },
    {
      $inc: { quantity: stock },
      $set: { updatedAt: new Date() },
    }
  );
};

/**
 * Executes a MongoDB Bulk Operation if it has operations queued.
 * Re-initializes the bulk instance after execution if needed.
 */

const executeInitializeBulk = async (bulkOp, collectionName) => {
  try {
    if (bulkOp?.s?.currentBatch?.operations?.length > 0) {
      await bulkOp.execute();
    }
  } catch (error) {
    console.error(`Bulk execute error on ${collectionName}:`, error);
    throw new Error(`Failed to execute bulk for ${collectionName}`);
  }

  return db.collection(collectionName).initializeOrderedBulkOp();
};

const formatDate = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${day}-${month}-${year}`;
};

const getOrderItemStatusText = (key) => {
  const statusObject = orderItemStatus.find((status) => status.key === key);
  return statusObject ? statusObject.value : 'Unknown';
};

module.exports = {
  create,
  getById,
  updateById,
  getList,
  getAllList,
  add,
  uniqueUpdateById,
  createResponse,
  commonSearchFields,
  uniqueAdd,
  uniqueQueryBasedUpdateById,
  categories,
  updateAmzStock,
  executeInitializeBulk,
  formatDate,
  getOrderItemStatusText,
};
