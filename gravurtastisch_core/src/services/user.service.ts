// @ts-nocheck
const httpStatus = require('http-status');
const User = require('../models/user.model');
const ChatModel = require('../models/chat.model');
const Role = require('../models/role.model');
const errorHandler = require('../utils/error.handler');
const { systemLog } = require('../utils/system-log');
const { uploadFile, deleteFile } = require('../utils/file-uploader');
const mongoose = require('mongoose');
const { createResponse } = require('../services/common.service');

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
      return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
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
      return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
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

const buildUserListQuery = (baseFilter, query = {}) => {
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

  if (query.search) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i');
    andParts.push({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { businessName: searchRegex },
        { contact_no: searchRegex },
      ],
    });
  }

  if (andParts.length) {
    filter.$and = andParts;
  }

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
  let sort = { createdAt: -1 };
  if (query.sortBy) {
    const [key, order] = String(query.sortBy).split(':');
    sort = { [key]: order === 'asc' ? 1 : -1 };
  }

  return { filter, page, limit, sort };
};

const paginateUserList = async (baseFilter, query, okMessage) => {
  const { filter, page, limit, sort } = buildUserListQuery(baseFilter, query);

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
      return createResponse(httpStatus.FORBIDDEN, 'Forbidden');
    }

    const { filter, page, limit, sort } = buildUserListQuery(
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
    return User.findById(id);
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

    // Remove confirm_password from updateBody if it exists
    const { email: _email, ...updateData } = updateBody;

    // Update user and get the updated document
    const result = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      updateData,
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

const uploadProfileImage = async (userId, data) => {
  const userData = await User.findById(userId);
  if (!userData) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    };
  }

  const fileName = await uploadFile(data, '');
  const resData = await User.findByIdAndUpdate(
    userId,
    { avatar: fileName },
    { new: true }
  );

  if (userData.avatar) {
    await deleteFile(userData.avatar, '');
  }

  if (resData) {
    await systemLog(
      'UPDATE',
      resData,
      userId,
      'update-profile-image',
      userData
    );
    const avatarUrl = `${process.env.BASE_URL}/uploads/${fileName}`;
    return {
      status: httpStatus.OK,
      data: resData,
      picture: fileName,
      avatarUrl: avatarUrl,
      message: 'Profile Picture has been uploaded.',
    };
  } else {
    errorHandler.errorM({
      action_type: 'update-profile-image',
      error_data: { message: 'occures while update profile image.' },
    });
    return {
      status: httpStatus.FORBIDDEN,
      message: 'Something want wrong, Please try again',
    };
  }
};

const updatePasswordById = async (userId, updateBody) => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return createResponse(httpStatus.NOT_FOUND, 'User not found');
    }
    const data = {};
    if (updateBody.password && updateBody.password !== '') {
      data['password'] = updateBody.password;
    }
    let result;
    if (
      (await user.isPasswordMatch(updateBody.currentPassword)) &&
      updateBody.password === updateBody.passwordConfirm
    ) {
      result = await User.findByIdAndUpdate(userId, data, { new: true });
    }

    if (result) {
      return createResponse(httpStatus.OK, 'sucessfully password updated');
    } else {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'something want wrong, please try again'
      );
    }
  } catch (error) {
    console.error('error: ');
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'something want wrong, please try again'
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
  updatePasswordById,
  getUserDetailById,
  getChatUserList,
};
