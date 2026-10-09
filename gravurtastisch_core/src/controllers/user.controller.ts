const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');
const emailService = require('../services/email.service');
const config = require('../config/config');
const { deleteFile } = require('../utils/file-uploader');
const User = require('../models/user.model');
const UserArchive = require('../models/user-archive.model');

const createUser = catchAsync(async (req, res) => {
  const { status, message, data } = await userService.createUser(req.body);
  res.status(status).send({ status, message, data });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { status, message, data, pagination } = await userService.queryUsers(
    filter,
    options
  );
  res.status(status).send({ status, message, data, pagination });
});

const getUser = catchAsync(async (req, res) => {
  const { status, message, data } = await userService.getUserDetailById(
    req.user._id
  );
  return res.status(status).send({ status, message, data });
});

const updateUser = catchAsync(async (req, res) => {
  const { status, message, data } = await userService.updateUserById({
    _id: req.user._id,
    ...req.body,
  });
  return res.status(status).send({ status, message, data });
});

const updateUserPassword = catchAsync(async (req, res) => {
  const { status, message, data } = await userService.updatePasswordById(
    req.user._id,
    req.body
  );
  return res.status(status).send({ status, message, data });
});

const deleteUser = catchAsync(async (req, res) => {
  // const { status, message, data } = await userService.deleteUserById(
  //   req.params.userId,
  //   req.params.loginId,
  //   req.body
  // );
  return res.status(200).send({ status: 200, message: '', data: {} });
});

const uploadProfile = catchAsync(async (req, res) => {
  const { status, message, data, picture } =
    await userService.uploadProfileImage(req.user._id, req.files.file);
  res.status(status).send({ status, message, data, picture });
});

const deleteProfile = catchAsync(async (req, res) => {
  await deleteFile(req.body.fileName, '');
  return res.status(200).json({
    status: httpStatus.OK,
    message: 'Profile Picture has been deleted.',
  });
});

const getAdminSellers = catchAsync(async (req, res) => {
  const result = await userService.listAdminSellers(req.query);
  res.status(result.status).send({
    status: result.status,
    message: result.message,
    data: result.data,
    pagination: result.pagination,
  });
});

const getAdminStaffUsers = catchAsync(async (req, res) => {
  const result = await userService.listAdminStaffUsers(req.query);
  res.status(result.status).send({
    status: result.status,
    message: result.message,
    data: result.data,
    pagination: result.pagination,
  });
});

const getTeamUsers = catchAsync(async (req, res) => {
  const result = await userService.listSellerTeamUsers(req.user, req.query);
  res.status(result.status).send({
    status: result.status,
    message: result.message,
    data: result.data,
    pagination: result.pagination,
  });
});

const createManagedUser = catchAsync(async (req, res) => {
  const result = await userService.createManagedUser(req.user, req.body);
  res.status(result.status).send(result);
});

const getUserForChat = catchAsync(async (req, res) => {
  const { message, status, data } = await userService.getChatUserList(
    req.params.userId
  );
  res.status(status).send({ status, message, data });
});

const adminUpdateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { status, planLimits, businessName, contact_no, role_id, name } =
    req.body;

  const existing = await User.findById(userId);
  if (!existing) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });
  }

  if (existing.isSuperAdmin) {
    return res.status(httpStatus.FORBIDDEN).send({
      status: httpStatus.FORBIDDEN,
      message: 'Super admin accounts cannot be modified via API',
    });
  }

  // Seller team updates must stay inside the seller org
  const { isSellerOwner } = require('../services/permission.service');
  if (isSellerOwner(req.user) || req.user.userType === 'seller') {
    const ownerId = isSellerOwner(req.user) ? req.user._id : req.user.parentId;
    if (
      existing.isSellerAdmin ||
      isSellerOwner(existing) ||
      String(existing.parentId) !== String(ownerId)
    ) {
      return res.status(httpStatus.FORBIDDEN).send({
        status: httpStatus.FORBIDDEN,
        message: 'Forbidden',
      });
    }
  }

  // Soft-delete: archive the user and remove from active collection
  if (status === 2) {
    await UserArchive.create({
      originalId: existing._id,
      name: existing.name,
      email: existing.email,
      businessName: existing.businessName,
      contact_no: existing.contact_no,
      role_id: existing.role_id,
      address: existing.address,
      avatar: existing.avatar,
      marketplaces: existing.marketplaces,
      isSuperAdmin: existing.isSuperAdmin,
      planLimits: existing.planLimits,
      status: existing.status,
    });

    await User.findByIdAndDelete(userId);

    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'User deleted successfully',
      data: {},
    });
  }

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (name !== undefined) updateData.name = name;
  if (businessName !== undefined) updateData.businessName = businessName;
  if (contact_no !== undefined) updateData.contact_no = contact_no;
  if (role_id !== undefined) updateData.role_id = role_id;
  if (planLimits !== undefined) {
    updateData.planLimits = {
      maxMarketplaces: Number(planLimits.maxMarketplaces),
      maxReviewRequestsPerMonth: Number(planLimits.maxReviewRequestsPerMonth),
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).populate('role_id', 'role_name scope permissions status');

  return res.status(httpStatus.OK).send({
    status: httpStatus.OK,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

const registerSeller = catchAsync(async (req, res) => {
  const { email, seller, business, phone, marketplaces } = req.body;
  const userBody = {
    email,
    name: seller,
    businessName: business,
    contact_no: phone,
    marketplaces,
    status: 0, // Inactive, needs admin approval
    userType: 'seller',
    isSellerAdmin: true,
    isSuperAdmin: false,
    parentId: null,
    role_id: null,
  };
  const result = await userService.createUser(userBody);

  if (result.status === httpStatus.OK || result.status === httpStatus.CREATED) {
    try {
      const content = `
        <h2 style="color: #0B1E39; margin: 0 0 16px;">New Seller Registration</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Business Name</td></tr>
          <tr><td style="padding:0 0 12px; color:#0B1E39; font-size:15px;">${business}</td></tr>
          <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Seller Name</td></tr>
          <tr><td style="padding:0 0 12px; color:#0B1E39; font-size:15px;">${seller}</td></tr>
          <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Email</td></tr>
          <tr><td style="padding:0 0 12px; color:#0B1E39; font-size:15px;"><a href="mailto:${email}" style="color:#2F6FED; text-decoration:none;">${email}</a></td></tr>
          <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Phone</td></tr>
          <tr><td style="padding:0 0 12px; color:#0B1E39; font-size:15px;">${
            phone || '—'
          }</td></tr>
        </table>
        <hr style="border:none; border-top:1px solid #e0e0e0; margin:20px 0;" />
        <p style="color:#888; font-size:13px;">This seller registered via the website and needs manual approval.</p>
      `;
      const htmlBody = await emailService.getMailBody(
        content,
        'New seller registration received'
      );
      await emailService.sendEmail(
        config.email.adminEmail,
        `New Seller Registration — ${seller}`,
        '',
        htmlBody
      );
    } catch (err) {
      console.error(
        'Failed to send seller registration notification email:',
        err
      );
    }
  }

  res.status(result.status).send(result);
});

module.exports = {
  createUser,
  createManagedUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadProfile,
  deleteProfile,
  getAdminSellers,
  getAdminStaffUsers,
  getTeamUsers,
  getUserForChat,
  updateUserPassword,
  adminUpdateUser,
  registerSeller,
};
