// @ts-nocheck
const httpStatus = require('http-status');
const moment = require('moment');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const ChatModel = require('../models/chat.model');
const Role = require('../models/role.model');
const ordermodel = require('../models/order.model');
const PlanModel = require('../models/plan.model');
const PaymentModel = require('../models/payment.model');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const errorHandler = require('../utils/error.handler');
const logger = require('../config/logger');
const { systemLog } = require('../utils/system-log');
const { uploadFile, deleteFile } = require('../utils/file-uploader');
const { createResponse } = require('../services/common.service');
const { syncUserSubscriptionPlans, syncUserMonthlyUsage } = require('./plan.service');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  try {
    if (userBody.isSuperAdmin) {
      return createResponse(
        httpStatus.FORBIDDEN,
        'Super admin accounts can only be created directly in the database'
      );
    }

    const UserExist = await User.findOne({ email: userBody.email });
    if (UserExist) {
      if (UserExist.status === 0) {
        return createResponse(
          httpStatus.CONFLICT,
          'An account with this email already exists but is pending approval. Please contact support if you need assistance.'
        );
      }
      return createResponse(
        httpStatus.CONFLICT,
        'An account with this email already exists. Please use a different email or contact support.'
      );
    }
    const userData = await User.create(userBody);
    await systemLog('CREATE', userData, userData._id, 'create-user');
    return createResponse(httpStatus.OK, 'User created', userData);
  } catch (error) {
    if (error.code === 11000) {
      return createResponse(
        httpStatus.CONFLICT,
        'An account with this email already exists. Please use a different email or contact support.'
      );
    }
    errorHandler.errorM({
      action_type: 'add-user',
      error_data: error,
    });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Create admin staff / seller team user. Requires role_id. Never creates superAdmin/sellerAdmin.
 */
const createManagedUser = async (actor, body) => {
  try {
    const { isSellerOwner } = require('./permission.service');
    const isAdminScope = actor.isSuperAdmin || actor.userType === 'admin';
    const sellerOwner = isSellerOwner(actor);
    const sellerOrgId = sellerOwner ? actor._id : actor.parentId;

    if (!isAdminScope && !sellerOrgId) {
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to perform this action.'
      );
    }

    if (!body.role_id) {
      return createResponse(httpStatus.BAD_REQUEST, 'role_id is required');
    }

    const role = await Role.findOne({ _id: body.role_id, status: 1 });
    if (!role) {
      return createResponse(httpStatus.BAD_REQUEST, 'Invalid role');
    }

    let payload;

    if (isAdminScope && (!body.scope || body.scope === 'admin')) {
      if (role.scope !== 'admin' || role.ownerId) {
        return createResponse(httpStatus.BAD_REQUEST, 'Role must be an admin role');
      }
      payload = {
        name: body.name,
        email: String(body.email).trim().toLowerCase(),
        contact_no: body.contact_no,
        role_id: role._id,
        userType: 'admin',
        isSellerAdmin: false,
        isSuperAdmin: false,
        parentId: null,
        status: body.status !== undefined ? body.status : 1,
        isEmailVerified: true,
      };
    } else if (sellerOrgId) {
      if (role.scope !== 'seller' || String(role.ownerId) !== String(sellerOrgId)) {
        return createResponse(
          httpStatus.BAD_REQUEST,
          'Role must belong to this seller organization'
        );
      }
      const owner = sellerOwner
        ? actor
        : await User.findById(sellerOrgId).lean();
      payload = {
        name: body.name,
        email: String(body.email).trim().toLowerCase(),
        contact_no: body.contact_no,
        role_id: role._id,
        userType: 'seller',
        isSellerAdmin: false,
        isSuperAdmin: false,
        parentId: sellerOrgId,
        businessName: owner?.businessName,
        status: body.status !== undefined ? body.status : 1,
        isEmailVerified: true,
      };
    } else {
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to perform this action.'
      );
    }

    if (body.password) {
      payload.password = body.password;
    }

    return createUser(payload);
  } catch (error) {
    errorHandler.errorM({ action_type: 'create-managed-user', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const buildUserListQuery = async (baseFilter, query = {}) => {
  const filter = { ...baseFilter };
  const andParts = [];

  if (baseFilter.$or) {
    andParts.push({ $or: baseFilter.$or });
    delete filter.$or;
  }
  if (baseFilter.$and) {
    andParts.push(...baseFilter.$and);
    delete filter.$and;
  }

  if (query.status !== undefined && query.status !== '') {
    filter.status = Number(query.status);
  } else {
    filter.status = { $ne: 2 };
  }

  if (query.userType) {
    filter.userType = query.userType;
  }

  // 1. Search across: name, email, plan, brand (businessName), role, marketplace, and quota
  if (query.search) {
    const rawSearch = String(query.search).trim();
    const escapedSearch = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');

    // Matching roles
    const matchingRoles = await Role.find({ role_name: searchRegex })
      .select('_id')
      .lean();
    const matchingRoleIds = matchingRoles.map((r) => r._id);

    // Matching plans
    const matchingPlans = await PlanModel.find({ name: searchRegex })
      .select('_id')
      .lean();
    const matchingPlanIds = matchingPlans.map((p) => p._id);

    // Numeric search for marketplace and quota
    const cleanNumStr = rawSearch.replace(/,/g, '');
    const numVal = Number(cleanNumStr);
    const isNumeric = !isNaN(numVal) && cleanNumStr !== '';

    const orConditions = [
      { name: searchRegex },
      { email: searchRegex },
      { businessName: searchRegex },
      { contact_no: searchRegex },
      { 'plans.name': searchRegex },
    ];

    if (matchingRoleIds.length > 0) {
      orConditions.push({ role_id: { $in: matchingRoleIds } });
    }
    if (/seller/i.test(rawSearch)) {
      orConditions.push(
        { userType: 'seller' },
        { isSellerAdmin: true },
        { role_id: null },
        { role_id: { $exists: false } }
      );
    }

    if (matchingPlanIds.length > 0) {
      orConditions.push(
        { currentPlanId: { $in: matchingPlanIds } },
        { 'plans.planId': { $in: matchingPlanIds } }
      );
    }

    if (isNumeric) {
      orConditions.push(
        { 'planLimits.maxMarketplaces': numVal },
        { 'plans.marketplace': numVal },
        { 'planLimits.maxReviewRequestsPerMonth': numVal },
        { 'plans.request_quota': numVal }
      );
    }

    andParts.push({ $or: orConditions });
  }

  // 2. Plan filter (multi-select)
  const plansParam = query.plans || query.plan;
  if (plansParam !== undefined && plansParam !== null && plansParam !== '') {
    if (plansParam === '__NONE__') {
      andParts.push({ _id: null });
    } else {
      let plansList = [];
      if (Array.isArray(plansParam)) {
        plansList = plansParam
          .flatMap((p) => String(p).split(','))
          .map((p) => p.trim())
          .filter(Boolean);
      } else if (typeof plansParam === 'string') {
        plansList = plansParam
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
      }

      if (plansList.length > 0) {
        const validObjectIds = [];
        const planNames = [];

        for (const p of plansList) {
          if (
            mongoose.Types.ObjectId.isValid(p) &&
            String(new mongoose.Types.ObjectId(p)) === p
          ) {
            validObjectIds.push(new mongoose.Types.ObjectId(p));
          } else {
            planNames.push(p);
          }
        }

        const orPlanConditions = [];
        if (validObjectIds.length > 0) {
          orPlanConditions.push(
            { currentPlanId: { $in: validObjectIds } },
            { 'plans.planId': { $in: validObjectIds } }
          );
        }
        if (planNames.length > 0) {
          const matchingDbPlans = await PlanModel.find({
            name: { $in: planNames },
          })
            .select('_id name')
            .lean();
          const foundIds = matchingDbPlans.map((p) => p._id);
          if (foundIds.length > 0) {
            orPlanConditions.push(
              { currentPlanId: { $in: foundIds } },
              { 'plans.planId': { $in: foundIds } }
            );
          }
          orPlanConditions.push({ 'plans.name': { $in: planNames } });
        }

        if (orPlanConditions.length > 0) {
          andParts.push({ $or: orPlanConditions });
        }
      }
    }
  }

  // 3. Date range filter (createdAt)
  const fromDateStr = query.from || query.startDate;
  const toDateStr = query.to || query.endDate;
  if (fromDateStr || toDateStr) {
    const dateQuery = {};
    if (fromDateStr) {
      const fromD = new Date(fromDateStr);
      if (!isNaN(fromD.getTime())) {
        fromD.setHours(0, 0, 0, 0);
        dateQuery.$gte = fromD;
      }
    }
    if (toDateStr) {
      const toD = new Date(toDateStr);
      if (!isNaN(toD.getTime())) {
        toD.setHours(23, 59, 59, 999);
        dateQuery.$lte = toD;
      }
    }
    if (Object.keys(dateQuery).length > 0) {
      andParts.push({ createdAt: dateQuery });
    }
  }

  if (andParts.length) {
    filter.$and = andParts;
  }

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
  let sort = { createdAt: -1 };
  if (query.sortBy) {
    const [rawKey, order] = String(query.sortBy).split(':');
    const keyMap = {
      role: 'role_id',
      currentPlan: 'plans.name',
      plan: 'plans.name',
      expireDate: 'plans.expireAt',
      expireAt: 'plans.expireAt',
      'planLimits.maxMarketplaces': 'planLimits.maxMarketplaces',
      'planLimits.maxReviewRequestsPerMonth': 'planLimits.maxReviewRequestsPerMonth',
      quota: 'planLimits.maxReviewRequestsPerMonth',
      marketplaces: 'planLimits.maxMarketplaces',
      markets: 'planLimits.maxMarketplaces',
      used: 'usedReviewRequests',
      usedReviewRequests: 'usedReviewRequests',
      mobile: 'contact_no',
      brand: 'businessName',
    };
    const key = keyMap[rawKey] || rawKey;
    sort = { [key]: order === 'asc' ? 1 : -1 };
  }

  return { filter, page, limit, sort };
};

const paginateUserList = async (baseFilter, query, okMessage) => {
  const { filter, page, limit, sort } = await buildUserListQuery(
    baseFilter,
    query
  );

  const [rawKey, orderStr] = query.sortBy ? String(query.sortBy).split(':') : ['', ''];
  const isRoleSort = rawKey === 'role';
  const roleOrder = orderStr === 'desc' ? -1 : 1;

  let totalResults = 0;
  let results = [];

  if (isRoleSort) {
    const [count, rawResults] = await Promise.all([
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'tbl_roles',
            localField: 'role_id',
            foreignField: '_id',
            as: 'role_info',
          },
        },
        {
          $addFields: {
            role_name_sort: {
              $toLower: {
                $ifNull: [{ $arrayElemAt: ['$role_info.role_name', 0] }, ''],
              },
            },
          },
        },
        { $sort: { role_name_sort: roleOrder, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { role_info: 0, role_name_sort: 0 } },
      ]),
    ]);
    totalResults = count;
    results = await User.populate(rawResults, [
      { path: 'role_id', select: 'role_name scope permissions status' },
      { path: 'currentPlanId', select: 'name price marketplace request_quota billingCycle status' },
    ]);
  } else {
    const [count, rawResults] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .populate('role_id', 'role_name scope permissions status')
        .populate('currentPlanId', 'name price marketplace request_quota billingCycle status')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    totalResults = count;
    results = rawResults;
  }

  if (Array.isArray(results) && results.length > 0) {
    const startOfMonth = moment().startOf('month').toDate();

    await Promise.all(
      results.map(async (u) => {
        if (Array.isArray(u.plans) && u.plans.length > 0) {
          await syncUserSubscriptionPlans(u);
        }
        await syncUserMonthlyUsage(u);
      })
    );
  }

  const totalPages = Math.ceil(totalResults / limit) || 1;
  return createResponse(httpStatus.OK, okMessage, results, {
    pagination: {
      page,
      limit,
      size: limit,
      totalPages,
      lastPage: totalPages,
      totalResults,
      length: totalResults,
    },
  });
};

/**
 * Seller org accounts (sellerAdmin or legacy owner without parentId).
 * Legacy rows often omit userType / isSellerAdmin — treat non-admin, no-parent as sellers.
 * Team members (parentId set) are excluded; they appear under seller Team only.
 */
const listAdminSellers = async (query = {}) => {
  try {
    return await paginateUserList(
      {
        isSuperAdmin: { $ne: true },
        userType: { $ne: 'admin' },
        $or: [
          { isSellerAdmin: true },
          { parentId: null },
          { parentId: { $exists: false } },
        ],
      },
      query,
      'Sellers fetched'
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'list-admin-sellers', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Admin staff (excludes superAdmin).
 */
const listAdminStaffUsers = async (query = {}) => {
  try {
    return await paginateUserList(
      {
        isSuperAdmin: { $ne: true },
        userType: 'admin',
      },
      query,
      'Admin users fetched'
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'list-admin-staff', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * List seller team users under a sellerAdmin. Excludes sellerAdmin itself.
 */
const listSellerTeamUsers = async (actor, query = {}) => {
  try {
    const { isSellerOwner } = require('./permission.service');
    const ownerId = isSellerOwner(actor) ? actor._id : actor.parentId;
    if (!ownerId) {
      return createResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to view team members.'
      );
    }

    const { filter, page, limit, sort } = await buildUserListQuery(
      {
        parentId: ownerId,
        isSellerAdmin: { $ne: true },
        isSuperAdmin: { $ne: true },
        userType: { $ne: 'admin' },
      },
      query
    );

    const [totalResults, results] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .populate('role_id', 'role_name scope permissions status')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalResults / limit) || 1;
    return createResponse(httpStatus.OK, 'Team users fetched', results, {
      pagination: {
        page,
        limit,
        size: limit,
        totalPages,
        lastPage: totalPages,
        totalResults,
        length: totalResults,
      },
    });
  } catch (error) {
    errorHandler.errorM({ action_type: 'list-seller-team', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  try {
    let searchData = [];
    const tmpStatus = parseInt(filter.status);
    searchData.push({ status: { $ne: 2 }, isSuperAdmin: { $ne: true } });

    if (tmpStatus === 1 || tmpStatus === 0) {
      searchData = [{ status: tmpStatus, isSuperAdmin: { $ne: true } }];
    }

    let sort = {};
    if (options.sortBy) {
      const [key, order] = options.sortBy.split(':');
      order === 'desc' ? (sort = { [key]: -1 }) : (sort = { [key]: 1 });
    }
    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i'); // case-insensitive regex

      searchData.push({
        $or: [
          { first_name: { $regex: searchRegex } },
          { last_name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { contact_no: { $regex: searchRegex } },
          { address: { $regex: searchRegex } },
          { 'role_data.role_name': { $regex: searchRegex } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$first_name', ' ', '$last_name'] },
                regex: searchRegex,
              },
            },
          },
        ],
      });
    }

    const limit =
      Number(options.limit) && parseInt(options.limit, 10) > 0
        ? parseInt(options.limit, 10)
        : 10;
    const page =
      Number(options.page) && parseInt(options.page, 10) > 0
        ? parseInt(options.page, 10)
        : 1;

    const skip = (page - 1) * limit;
    const countPromise = await User.aggregate([
      {
        $lookup: {
          from: 'tbl_roles',
          localField: 'role_id',
          foreignField: '_id',
          as: 'role_data',
        },
      },
      { $match: { $and: searchData } },
      { $count: 'count' },
    ]).exec();

    let docsPromise = User.aggregate([
      {
        $lookup: {
          from: 'tbl_roles',
          localField: 'role_id',
          foreignField: '_id',
          as: 'role_data',
        },
      },
      { $match: { $and: searchData } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          first_name: 1,
          last_name: 1,
          is_white_list_ip: 1,
          contact_no: 1,
          avatar: 1,
          email: 1,
          address: 1,
          role_name: { $arrayElemAt: ['$role_data.role_name', 0] },
          status: 1,
        },
      },
    ]);

    docsPromise = docsPromise.exec();
    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalCount, results] = values;
      const totalResults = totalCount[0] && totalCount[0].count;
      const totalPages = Math.ceil(totalResults / limit);
      const pagination = {
        length: totalResults,
        size: limit,
        page: page,
        lastPage: totalPages,
      };
      return Promise.resolve(
        createResponse(httpStatus.OK, 'get all user successfully', results, {
          pagination,
        })
      );
    });
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-user-list',
      error_data: error,
    });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserDetailById = async (id) => {
  try {
    const data = await getUserById(id);
    if (data) {
      return createResponse(httpStatus.OK, 'get user successfully', data);
    } else {
      return createResponse(httpStatus.NOT_FOUND, 'User not found');
    }
  } catch (error) {
    errorHandler.errorM({
      action_type: 'find-user-by-id',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

const getUserById = async (id) => {
  try {
    const user = await User.findById(id).populate('currentPlanId');
    if (user) {
      await syncUserMonthlyUsage(user).catch(() => {});
    }
    return user;
  } catch (error) {
    errorHandler.errorM({
      action_type: 'find-user-by-id',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  try {
    return User.findOne({ email, status: { $ne: 2 } });
  } catch (error) {
    errorHandler.errorM({
      action_type: 'find-user-by-email',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (updateBody) => {
  const userId = updateBody._id;
  try {
    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return createResponse(httpStatus.BAD_REQUEST, 'Invalid user ID format');
    }

    // Find existing user (who is not deleted)
    const existingData = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      status: { $ne: 2 },
    });

    if (!existingData) {
      return createResponse(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if name already exists for another user
    if (updateBody.name) {
      const emailExists = await User.findOne({
        name: updateBody.email,
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
        status: { $ne: 2 },
      });

      if (emailExists) {
        return createResponse(httpStatus.CONFLICT, 'Email already exists');
      }
    }

    // Omit immutable _id, email, and confirm_password from updateData
    const { _id, email: _email, confirm_password, ...updateData } = updateBody;

    // Normalize phone / contact input to contact_no if passed under alternative keys
    if (updateBody.phone !== undefined && updateData.contact_no === undefined) {
      updateData.contact_no = updateBody.phone;
    }
    if (updateBody.contact !== undefined && updateData.contact_no === undefined) {
      updateData.contact_no = updateBody.contact;
    }

    // Update user and get the updated document
    const result = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (result) {
      // Log full updated data (after DB update)
      await systemLog('UPDATE', result, userId, 'update-user', existingData);
      return createResponse(
        httpStatus.OK,
        'User updated successfully!',
        result
      );
    } else {
      errorHandler.errorM({
        action_type: 'update-user',
        error_data: { message: 'Error while updating user.' },
      });
      return createResponse(
        httpStatus.BAD_REQUEST,
        'Error while updating user'
      );
    }
  } catch (error) {
    console.error('Error updating user:', error);
    errorHandler.errorM({
      action_type: 'update-user',
      error_data: error,
    });
    return createResponse(httpStatus.BAD_REQUEST, 'Error while updating user');
  }
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId, loginId, data) => {
  try {
    const res = await User.findByIdAndUpdate(userId, data, { new: true });
    if (res) {
      if (data.status === 0 || data.status === 1) {
        await systemLog('UPDATE', data, loginId, 'active-deactive-user', {
          status: data.status === 1 ? 0 : 1,
        });
      }
      if (data.status === 2) {
        await systemLog('DELETE', res, loginId, 'delete-user');
      }
      return {
        status: httpStatus.OK,
        data: res,
        message: '',
      };
    } else {
      errorHandler.errorM({
        action_type: 'delete-user',
        error_data: { message: 'occures while delete user.' },
      });
      return {
        status: httpStatus.BAD_REQUEST,
        data: '',
        message: 'User not found!',
      };
    }
  } catch (error) {
    errorHandler.errorM({
      action_type: 'delete-user',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      data: '',
      message: 'Error while delete user',
    };
  }
};

/**
 * Update user status by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const updateUserStatusById = async (userId) => {
  const userStatus = await User.findById(userId);
  if (!userStatus) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    };
  }
  let query = {};
  if (userStatus.status === 1) {
    query = { status: 0 };
  } else {
    query = { status: 1 };
  }

  const updateDetailRes = await User.findByIdAndUpdate(userId, query);
  if (updateDetailRes) {
    await systemLog(
      'UPDATE',
      updateDetailRes,
      userId,
      'update-user-status',
      userStatus
    );
    return {
      status: httpStatus.OK,
      message: 'Status updated successfully',
    };
  } else {
    errorHandler.errorM({
      action_type: 'update-user-status',
      error_data: { message: 'occures while update user status.' },
    });
    return {
      status: httpStatus.FORBIDDEN,
      message: 'Something want wrong, Please try again',
    };
  }
};

const uploadProfileImage = async (userId, file) => {
  const userData = await User.findById(userId);
  if (!userData) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    };
  }

  if (!file) {
    return {
      status: httpStatus.BAD_REQUEST,
      message: 'Image file is required',
    };
  }

  const uploadDir = path.join(__dirname, '../uploads/profiles');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext =
    path
      .extname(file.name || file.originalFilename || file.path || '')
      .toLowerCase() || '.png';
  const uniqueName = `profile-${Date.now()}-${Math.floor(
    100000000 + Math.random() * 900000000
  )}${ext}`;
  const targetPath = path.join(uploadDir, uniqueName);

  if (file.path && fs.existsSync(file.path)) {
    fs.copyFileSync(file.path, targetPath);
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // ignore
    }
  } else if (file.buffer) {
    fs.writeFileSync(targetPath, file.buffer);
  }

  // Remove previous avatar file if exists
  if (userData.avatar) {
    const prevFile = userData.avatar.replace(/^(\/?uploads\/)?(\/?profiles\/)?/, '');
    const oldPath = path.join(uploadDir, prevFile);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        // ignore
      }
    }
  }

  const relativePath = `profiles/${uniqueName}`;
  const baseUrl = (config.site_url || process.env.BASE_URL || 'http://localhost:7051').replace(/\/+$/, '');
  const avatarUrl = `${baseUrl}/${relativePath}`;

  const resData = await User.findByIdAndUpdate(
    userId,
    { avatar: relativePath },
    { new: true }
  );

  if (resData) {
    await systemLog(
      'UPDATE',
      resData,
      userId,
      'update-profile-image',
      userData
    );
    return {
      status: httpStatus.OK,
      data: resData,
      picture: relativePath,
      avatar: relativePath,
      avatarUrl: avatarUrl,
      message: 'Profile picture has been uploaded.',
    };
  } else {
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to update user profile image',
    };
  }
};

const deleteProfileImage = async (userId) => {
  const userData = await User.findById(userId);
  if (!userData) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    };
  }

  if (userData.avatar) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    const prevFile = userData.avatar.replace(/^(\/?uploads\/)?(\/?profiles\/)?/, '');
    const oldPath = path.join(uploadDir, prevFile);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        // ignore
      }
    }
  }

  const resData = await User.findByIdAndUpdate(
    userId,
    { avatar: '' },
    { new: true }
  );

  return {
    status: httpStatus.OK,
    data: resData,
    message: 'Profile picture has been removed.',
  };
};

const updatePasswordById = async (userId, updateBody) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return createResponse(httpStatus.NOT_FOUND, 'User not found');
    }

    if (!updateBody.currentPassword) {
      return createResponse(httpStatus.BAD_REQUEST, 'Current password is required');
    }

    const isMatch = await user.isPasswordMatch(updateBody.currentPassword);
    if (!isMatch) {
      return createResponse(httpStatus.BAD_REQUEST, 'Current password is incorrect');
    }

    if (!updateBody.password || updateBody.password.length < 8) {
      return createResponse(httpStatus.BAD_REQUEST, 'New password must be at least 8 characters long');
    }

    if (!updateBody.password.match(/\d/) || !updateBody.password.match(/[a-zA-Z]/)) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'New password must contain at least one letter and one number'
      );
    }

    if (updateBody.password !== updateBody.passwordConfirm) {
      return createResponse(httpStatus.BAD_REQUEST, 'New password and confirm password do not match');
    }

    user.password = updateBody.password;
    await user.save();

    await systemLog('UPDATE', { _id: user._id }, userId, 'update-password');
    return createResponse(httpStatus.OK, 'Password updated successfully');
  } catch (error) {
    console.error('Password update error:', error);
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error?.message || 'Failed to update password'
    );
  }
};

const getChatUserList = async (id) => {
  const userData = await User.find({
    status: { $ne: 2 },
  });

  const userInfo = [];
  // userData.forEach(async function (e) {
  //   const newId = e._id.toString()
  //   const latestChatQuery = [
  //     {
  //       "$match": {
  //         "$and": [
  //           {
  //             "receiver_id":
  //               { $size: 1 }
  //           }, {
  //             "$or": [
  //               { "receiver_id": mongoose.Types.ObjectId(id) },
  //               { "sender_id": mongoose.Types.ObjectId(id) },
  //               { "receiver_id": mongoose.Types.ObjectId(newId) },
  //               { "sender_id": mongoose.Types.ObjectId(newId) }
  //             ]
  //           }
  //         ]
  //       }
  //     },
  //     { "$sort": { "createdAt": -1 } },
  //     { "$limit": 1 },
  //     {
  //       "$lookup": {
  //         "from": "tbl_messages",
  //         "localField": "message_id",
  //         "foreignField": "_id",
  //         "as": "Chat"
  //       }
  //     },
  //     { $unwind: "$Chat" },
  //     {
  //       "$project": {
  //         message: "$Chat.message",
  //         message_id: "$Chat._id"
  //       }
  //     }

  //   ]
  //   const result = await ChatModel.aggregate(latestChatQuery);
  //
  //   const latestChat = result[0];
  //   const newObj = { ...e, message: latestChat?.message || "", message_id: latestChat?.message_id || "" };
  //   userInfo.push(newObj);
  // })
  for (const e of userData) {
    const newId = e._id.toString();
    const newDoc = { ...e, id: e._id };
    delete newDoc._id;
    delete newDoc.password;
    delete newDoc.__v;

    // const latestChatQuery = [
    //   {
    //     "$match": {
    //       "$and": [{
    //         "$or": [{
    //           $and: [
    //             { "sender_id": { $eq: mongoose.Types.ObjectId(newId) } },
    //             { "receiver_id": { $eq: mongoose.Types.ObjectId(id) } }
    //           ]
    //         },
    //         {
    //           $and:
    //             [
    //               { "receiver_id": { $eq: mongoose.Types.ObjectId(newId) } },
    //               { "sender_id": { $eq: mongoose.Types.ObjectId(id) } }
    //             ]
    //         }
    //         ]
    //       }
    //       ]
    //     }
    //   },
    //   { "$sort": { "createdAt": -1 } },
    //   { "$limit": 1 },
    //   {
    //     "$lookup": {
    //       "from": "tbl_messages",
    //       "localField": "message_id",
    //       "foreignField": "_id",
    //       "as": "Chat"
    //     }
    //   },
    //   { $unwind: "$Chat" },
    //   {
    //     "$project": {
    //       message: "$Chat.message",
    //       message_id: "$Chat._id"
    //     }
    //   }

    // ]

    const latestChatQuery = [
      {
        $match: {
          group_id: { $exists: false },
          $or: [
            {
              $and: [
                {
                  receiver_id: {
                    $eq: mongoose.Types.ObjectId(id),
                  },
                },
                { sender_id: { $eq: mongoose.Types.ObjectId(newId) } },
              ],
            },
            {
              $and: [
                {
                  receiver_id: {
                    $eq: mongoose.Types.ObjectId(newId),
                  },
                },
                {
                  sender_id: {
                    $eq: mongoose.Types.ObjectId(id),
                  },
                },
              ],
            },
          ],
          status: { $ne: 2 },
        },
      },
      {
        $lookup: {
          from: 'tbl_messages',
          localField: 'message_id',
          foreignField: '_id',
          as: 'Messages',
        },
      },
      {
        $lookup: {
          from: 'tbl_order_comments',
          localField: 'order_comment_id',
          foreignField: '_id',
          as: 'OrderComment',
        },
      },
      {
        $project: {
          message_id: 1,
          message: { $arrayElemAt: ['$Messages.message', 0] },
          createdAt: { $arrayElemAt: ['$Messages.createdAt', 0] },
        },
      },
      { $sort: { createdAt: -1 } },
    ];
    const result = await ChatModel.aggregate(latestChatQuery);
    const latestChat = result[0];
    const newObj = {
      ...newDoc._doc,
      id: newDoc._doc._id,
      message: latestChat?.message || '',
      message_id: latestChat?.message_id || '',
      createdAt: latestChat?.createdAt || '',
    };
    delete newObj._id;
    userInfo.push(newObj);
  }
  /* ******** sorting ******** */
  const data = userInfo.sort((a, b) => b.createdAt - a.createdAt);
  if (data) {
    return {
      status: httpStatus.OK,
      message: 'User list.',
      data: data,
    };
  } else {
    return {
      status: httpStatus.BAD_REQUEST,
      message: 'Something went wrong..',
      data: [],
    };
  }
};

/**
 * Manually assign a plan to a seller / user from the admin panel.
 * Updates user limits, currentPlanId, user.plans array, subscription status,
 * creates an audit payment record, and optionally sends notification email.
 */
const assignPlanManuallyToUser = async (actor, userId, data = {}) => {
  try {
    const {
      planId,
      billingCycle,
      activationMode = 'immediate', // 'immediate' | 'extend'
      sendNotification = true,
      customExpireAt,
    } = data;

    if (!planId) {
      return createResponse(httpStatus.BAD_REQUEST, 'Plan ID is required.');
    }

    const user = await User.findById(userId);
    if (!user || user.status === 2) {
      return createResponse(httpStatus.NOT_FOUND, 'Seller / User not found.');
    }

    const plan = await PlanModel.findById(planId);
    if (!plan || plan.status === 2) {
      return createResponse(httpStatus.NOT_FOUND, 'Selected plan not found or inactive.');
    }

    const cycle = Number(billingCycle ?? plan.billingCycle) || 1;
    const now = new Date();

    if (!Array.isArray(user.plans)) {
      user.plans = [];
    }

    // Auto-mark any active plan whose expireAt is in the past as expired (2)
    user.plans.forEach((p) => {
      if (
        (p.status === 1 || p.status === 'active') &&
        p.expireAt &&
        new Date(p.expireAt).getTime() < now.getTime()
      ) {
        p.status = 2; // Expired
      }
    });

    // Check if user currently has an ongoing active (1) or queued (4) plan
    let latestExpireDate = null;
    let currentActivePlan = null;

    user.plans.forEach((p) => {
      const isOngoing =
        (p.status === 1 || p.status === 4 || p.status === 'active' || p.status === 'queued') &&
        p.expireAt &&
        new Date(p.expireAt).getTime() > now.getTime();

      if (isOngoing) {
        const pExp = new Date(p.expireAt);
        if (!latestExpireDate || pExp.getTime() > latestExpireDate.getTime()) {
          latestExpireDate = pExp;
        }
        if (p.status === 1 || p.status === 'active') {
          currentActivePlan = p;
        }
      }
    });

    const hasOngoingPlan = Boolean(latestExpireDate && latestExpireDate.getTime() > now.getTime());
    const baseStartDate = hasOngoingPlan ? new Date(latestExpireDate) : new Date(now);

    let expireDate = customExpireAt ? new Date(customExpireAt) : null;
    if (!expireDate) {
      const calcExpire = new Date(baseStartDate);
      if (cycle === 2) {
        calcExpire.setMonth(calcExpire.getMonth() + 3);
      } else if (cycle === 3) {
        calcExpire.setFullYear(calcExpire.getFullYear() + 1);
      } else {
        calcExpire.setMonth(calcExpire.getMonth() + 1);
      }
      expireDate = calcExpire;
    }

    let newPlanStatus = 1;
    if (hasOngoingPlan) {
      // The current working plan continues uninterrupted!
      // The new plan is queued to start automatically after the current plan finishes.
      newPlanStatus = 4; // 4 = queued / scheduled
      user.subscriptionStatus = 1; // 1: active
      user.status = 1; // 1: active seller account
    } else {
      // No active plan: activate new plan immediately today
      newPlanStatus = 1; // 1 = active
      user.currentPlanId = plan._id;
      user.planLimits = {
        maxMarketplaces: Number(plan.marketplace) || 1,
        maxReviewRequestsPerMonth: Number(plan.request_quota) || 1000,
      };
      user.subscriptionStatus = 1; // 1: active
      user.status = 1; // 1: active seller account
    }

    const newPlanEntry = {
      planId: plan._id,
      name: plan.name,
      price: Number(plan.price) || 0,
      marketplace: Number(plan.marketplace) || 1,
      request_quota: Number(plan.request_quota) || 1000,
      billingCycle: cycle,
      startsAt: baseStartDate,
      expireAt: expireDate,
      status: newPlanStatus,
      paymentStatus: 1, // paid
      stripeSessionId: null,
      stripePaymentIntentId: null,
      selectedAt: now,
    };

    user.plans.push(newPlanEntry);
    await user.save();

    // Create an audit payment record
    const payment = await PaymentModel.create({
      userId: user._id,
      planId: plan._id,
      planName: plan.name,
      amount: Number(plan.price) || 0,
      currency: plan.currency || 'eur',
      status: 'paid',
      paidAt: now,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.businessName,
      billingCycle: cycle,
      metadata: {
        assignedManuallyByAdmin: true,
        isQueued: hasOngoingPlan,
        startsAt: baseStartDate.toISOString(),
        expireAt: expireDate.toISOString(),
        assignedByAdminId: actor?._id || null,
        assignedByAdminEmail: actor?.email || null,
      },
    });

    // Optionally notify customer using existing email template
    if (sendNotification) {
      try {
        const paymentService = require('./payment.service');
        if (paymentService.notifyPaymentPaid) {
          paymentService.notifyPaymentPaid(payment, plan).catch((err) => {
            logger.warn(`Admin assign plan notification email failed: ${err.message}`);
          });
        }
      } catch (emailErr) {
        logger.warn(`Could not trigger confirmation email: ${emailErr.message}`);
      }
    }

    const modeText = hasOngoingPlan
      ? `queued to activate after current plan finishes on ${baseStartDate.toLocaleDateString()} (valid until ${expireDate.toLocaleDateString()})`
      : `activated immediately (expires ${expireDate.toLocaleDateString()})`;

    return createResponse(
      httpStatus.OK,
      `Plan "${plan.name}" successfully assigned to ${user.name || user.email} (${modeText}).`,
      {
        user,
        plan: newPlanEntry,
        payment,
        isQueued: hasOngoingPlan,
        startsAt: baseStartDate,
        expireAt: expireDate,
      }
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'assign-plan-manually', error_data: error });
    return createResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Cancel the current and queued subscription plan for a seller.
 */
const cancelPlanForUser = async (userId, actor) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return createResponse(httpStatus.NOT_FOUND, 'User not found');
    }

    const now = new Date();
    if (Array.isArray(user.plans)) {
      user.plans.forEach((p) => {
        if (p.status === 1 || p.status === 4 || p.status === 'active' || p.status === 'queued') {
          p.status = 3; // 3: canceled
          p.canceledAt = now;
        }
      });
    }

    user.subscriptionStatus = 3; // 3: canceled
    user.currentPlanId = null;
    user.planLimits = {
      maxMarketplaces: 0,
      maxReviewRequestsPerMonth: 0,
      usedReviewRequests: user.planLimits?.usedReviewRequests || 0,
      usageMonth: user.planLimits?.usageMonth || null,
    };

    await user.save();

    // If an active Stripe subscription exists, cancel it in Stripe
    try {
      const payment = await PaymentModel.findOne({
        userId: user._id,
        stripeSubscriptionId: { $ne: null },
        status: { $in: ['paid', 'active'] },
      }).sort({ createdAt: -1 });

      if (payment?.stripeSubscriptionId) {
        const { getStripe } = require('./payment.service');
        const stripe = getStripe();
        if (stripe) {
          await stripe.subscriptions.cancel(payment.stripeSubscriptionId).catch((err) => {
            logger.warn(`Stripe subscription cancel failed: ${err.message}`);
          });
        }
        payment.status = 'canceled';
        await payment.save();
      }
    } catch (stripeErr) {
      logger.warn(`Error cancelling Stripe subscription: ${stripeErr.message}`);
    }

    return createResponse(
      httpStatus.OK,
      `Subscription plan for "${user.name || user.email}" has been cancelled successfully.`,
      { user }
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'cancel-plan-by-admin', error_data: error });
    return createResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = {
  createUser,
  createManagedUser,
  listAdminSellers,
  listAdminStaffUsers,
  listSellerTeamUsers,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  updateUserStatusById,
  uploadProfileImage,
  deleteProfileImage,
  updatePasswordById,
  getUserDetailById,
  getChatUserList,
  assignPlanManuallyToUser,
  cancelPlanForUser,
};
