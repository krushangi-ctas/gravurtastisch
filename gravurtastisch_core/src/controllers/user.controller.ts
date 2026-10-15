const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');
const emailService = require('../services/email.service');
const config = require('../config/config');
const { deleteFile } = require('../utils/file-uploader');
const User = require('../models/user.model');
const UserArchive = require('../models/user-archive.model');
const mongoose = require('mongoose');
const PlanModel = require('../models/plan.model');
const paymentService = require('../services/payment.service');

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
        message: 'You do not have permission to modify this user.',
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
  const { email, seller, business, phone, planId } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();

  let selectedPlan = null;
  if (planId) {
    if (mongoose.Types.ObjectId.isValid(planId)) {
      selectedPlan = await PlanModel.findOne({ _id: planId, status: 1 });
    }
    if (!selectedPlan) {
      return res.status(httpStatus.BAD_REQUEST).send({
        status: httpStatus.BAD_REQUEST,
        message: 'Selected plan was not found or is no longer active.',
      });
    }
  }

  const isPaidPlan = selectedPlan ? Number(selectedPlan.price) > 0 : false;

  const planLimits = selectedPlan
    ? {
      maxMarketplaces: Number(selectedPlan.marketplace) || 1,
      maxReviewRequestsPerMonth: Number(selectedPlan.request_quota) || 1000,
    }
    : {
      maxMarketplaces: 5,
      maxReviewRequestsPerMonth: 1000,
    };

  const calculatePlanExpireAt = (cycle, baseDate = new Date()) => {
    const d = new Date(baseDate);
    if (cycle === 2) {
      d.setMonth(d.getMonth() + 3);
    } else if (cycle === 3) {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d;
  };

  const planCycle = selectedPlan ? (Number(selectedPlan.billingCycle) || 1) : 1;
  const planExpireAt = selectedPlan
    ? (selectedPlan.expireAt || calculatePlanExpireAt(planCycle))
    : null;

  const plansArray = selectedPlan
    ? [
      {
        planId: selectedPlan._id,
        name: selectedPlan.name,
        price: Number(selectedPlan.price) || 0,
        marketplace: Number(selectedPlan.marketplace) || 1,
        request_quota: Number(selectedPlan.request_quota) || 1000,
        billingCycle: planCycle,
        expireAt: planExpireAt,
        status: isPaidPlan ? 0 : 1, // 0: pending_payment, 1: active
        paymentStatus: isPaidPlan ? 0 : 1, // 0: pending, 1: paid
        selectedAt: new Date(),
      },
    ]
    : [];

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (
      (existingUser.subscriptionStatus === 0 || existingUser.subscriptionStatus === 'pending_payment') &&
      isPaidPlan &&
      selectedPlan
    ) {
      existingUser.name = seller || existingUser.name;
      existingUser.businessName = business || existingUser.businessName;
      existingUser.contact_no = phone || existingUser.contact_no;
      existingUser.currentPlanId = selectedPlan._id;
      existingUser.planLimits = planLimits;
      existingUser.plans = plansArray;
      existingUser.status = 1; // Active status on registration
      await existingUser.save();

      try {
        const checkoutResult = await paymentService.createCheckoutSession({
          planId: selectedPlan._id,
          email: normalizedEmail,
          name: seller,
          userId: existingUser._id,
        });

        if (checkoutResult?.data?.sessionId) {
          existingUser.plans[0].stripeSessionId = checkoutResult.data.sessionId;
          await existingUser.save();
        }

        return res.status(httpStatus.OK).send({
          status: httpStatus.OK,
          message: 'Payment checkout created. Redirecting to payment...',
          data: {
            user: existingUser,
            checkoutUrl: checkoutResult.data.url,
            sessionId: checkoutResult.data.sessionId,
          },
        });
      } catch (stripeErr: any) {
        console.error('Failed to create Stripe Checkout session for pending seller:', stripeErr);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          status: httpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to initialize Stripe payment: ${stripeErr?.message || 'Payment gateway error'}`,
          data: { user: existingUser },
        });
      }
    }

    if (existingUser.status === 0) {
      return res.status(httpStatus.CONFLICT).send({
        status: httpStatus.CONFLICT,
        message:
          'An account with this email already exists but is pending approval. Please contact support if you need assistance.',
      });
    }

    return res.status(httpStatus.CONFLICT).send({
      status: httpStatus.CONFLICT,
      message:
        'An account with this email already exists. Please use a different email or contact support.',
    });
  }

  const userBody = {
    email: normalizedEmail,
    name: seller,
    businessName: business,
    contact_no: phone,
    status: 1, // Active user status on registration
    userType: 'seller',
    isSellerAdmin: true,
    isSuperAdmin: false,
    parentId: null,
    role_id: null,
    currentPlanId: selectedPlan ? selectedPlan._id : null,
    planLimits,
    plans: plansArray,
    subscriptionStatus: isPaidPlan ? 0 : 1, // 0: pending_payment, 1: active
  };

  const result = await userService.createUser(userBody);
  if (result.status !== httpStatus.OK && result.status !== httpStatus.CREATED) {
    return res.status(result.status).send(result);
  }

  const createdUser = result.data;
  let checkoutSession = null;

  if (isPaidPlan && selectedPlan) {
    try {
      checkoutSession = await paymentService.createCheckoutSession({
        planId: selectedPlan._id,
        email: normalizedEmail,
        name: seller,
        userId: createdUser._id,
      });

      if (checkoutSession?.data?.sessionId) {
        await User.updateOne(
          { _id: createdUser._id, 'plans.planId': selectedPlan._id },
          { $set: { 'plans.$.stripeSessionId': checkoutSession.data.sessionId } }
        );
      }
    } catch (stripeError: any) {
      console.error('Failed to create Stripe Checkout session for seller:', stripeError);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to initialize Stripe payment: ${stripeError?.message || 'Payment gateway error'}`,
        data: {
          user: createdUser,
        },
      });
    }
  }

  res.status(httpStatus.OK).send({
    status: httpStatus.OK,
    message: checkoutSession?.data?.url
      ? 'Registration initiated. Redirecting to payment...'
      : 'Seller registered successfully.',
    data: {
      ...(createdUser.toObject ? createdUser.toObject() : createdUser),
      checkoutUrl: checkoutSession?.data?.url || null,
      sessionId: checkoutSession?.data?.sessionId || null,
    },
  });

  if (config.email.adminEmail) {
    (async () => {
      try {
        const planDetailsHtml = selectedPlan
          ? `
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Selected Plan</td></tr>
            <tr><td style="padding:0 0 12px; color:#282828; font-size:15px;"><strong>${selectedPlan.name}</strong> ($${selectedPlan.price}/mo) — ${selectedPlan.marketplace} marketplaces, ${selectedPlan.request_quota} requests/mo</td></tr>
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Payment Status</td></tr>
            <tr><td style="padding:0 0 12px; color:#282828; font-size:15px;">${isPaidPlan ? 'Pending Payment (Stripe)' : 'Free Plan (Active)'}</td></tr>
          `
          : '';

        const content = `
          <h2 style="color: #282828; margin: 0 0 16px;">New Seller Registration</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Business Name</td></tr>
            <tr><td style="padding:0 0 12px; color:#282828; font-size:15px;">${business}</td></tr>
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Seller Name</td></tr>
            <tr><td style="padding:0 0 12px; color:#282828; font-size:15px;">${seller}</td></tr>
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Email</td></tr>
            <tr><td style="padding:0 0 12px; color:#282828; font-size:15px;"><a href="mailto:${email}" style="color:#282828; text-decoration:none;">${email}</a></td></tr>
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Phone</td></tr>
            <tr><td style="padding:0 0 12px; color:#1E1035; font-size:15px;">${phone || '—'}</td></tr>
            ${planDetailsHtml}
          </table>
          <hr style="border:none; border-top:1px solid #e0e0e0; margin:20px 0;" />
          <p style="color:#888; font-size:13px;">This seller registered via the website.</p>
        `;
        const htmlBody = await emailService.getMailBody(
          content,
          'New seller registration received'
        );
        await emailService.sendEmail(
          config.email.adminEmail,
          `New Seller Registration - ${seller}`,
          '',
          htmlBody
        );
      } catch (err) {
        console.error(
          'Failed to send seller registration notification email:',
          err
        );
      }
    })();
  }
});

const assignPlanToUser = catchAsync(async (req, res) => {
  const result = await userService.assignPlanManuallyToUser(
    req.user,
    req.params.userId,
    req.body
  );
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
  assignPlanToUser,
};
