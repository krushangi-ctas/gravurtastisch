// @ts-nocheck
const crypto = require('crypto');
const httpStatus = require('http-status');
const UniversalOtp = require('../models/universal-otp.model');
const { createResponse } = require('./common.service');
const errorHandler = require('../utils/error.handler');

const TTL_MS = 5 * 60 * 1000; // 5 minutes

const generateSixDigit = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

const normalizeSystem = (system) => {
  return String(system || '')
    .trim()
    .toLowerCase();
};

const toClientRecord = (doc) => {
  if (!doc) return null;
  const item = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    id: item._id || item.id,
    system: item.system,
    otp: item.otp,
    generatedAt:
      item.generatedAt instanceof Date
        ? item.generatedAt.toISOString()
        : item.generatedAt,
    expiresAt:
      item.expiresAt instanceof Date
        ? item.expiresAt.toISOString()
        : item.expiresAt,
    generatedBy: item.generatedBy || 'manual',
    status: item.status !== undefined ? item.status : 1,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

/**
 * Generate a new 6-digit Universal OTP for the given system.
 * Upserts the record and sets 5-minute expiry.
 */
const generate = async (system, generatedBy = 'manual') => {
  try {
    const systemKey = normalizeSystem(system);
    if (!systemKey) {
      return createResponse(httpStatus.BAD_REQUEST, 'System identifier is required');
    }

    const now = new Date();
    const payload = {
      system: systemKey,
      otp: generateSixDigit(),
      generatedAt: now,
      expiresAt: new Date(now.getTime() + TTL_MS),
      generatedBy: generatedBy === 'auto' ? 'auto' : 'manual',
      status: 1,
    };

    const doc = await UniversalOtp.findOneAndUpdate(
      { system: systemKey },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return createResponse(
      httpStatus.OK,
      'OTP generated successfully',
      toClientRecord(doc)
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-generate',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to generate universal OTP'
    );
  }
};

/**
 * Get the currently active Universal OTP for a system.
 */
const getCurrent = async (system) => {
  try {
    const systemKey = normalizeSystem(system);
    if (!systemKey) {
      return createResponse(httpStatus.BAD_REQUEST, 'System is required');
    }

    const doc = await UniversalOtp.findOne({
      system: systemKey,
      status: 1,
    });

    if (!doc) {
      return createResponse(httpStatus.OK, 'No OTP found', null);
    }

    return createResponse(
      httpStatus.OK,
      'OTP retrieved successfully',
      toClientRecord(doc)
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-current',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to get current universal OTP'
    );
  }
};

/**
 * Validate whether the provided OTP is a valid, active, non-expired universal OTP for the system.
 */
const isValidUniversalOtp = async (system, otp) => {
  try {
    const systemKey = normalizeSystem(system);
    const inputOtp = String(otp || '').trim();
    if (!systemKey || !inputOtp) return false;

    const aliases = [systemKey];
    if (systemKey.includes('_')) {
      aliases.push(systemKey.replace(/_/g, ''));
    } else {
      aliases.push(systemKey.replace(/^reviewsnapp/i, 'review_snapp'));
    }

    const doc = await UniversalOtp.findOne({
      system: { $in: aliases },
      status: 1,
    });

    if (!doc) return false;
    if (new Date() > new Date(doc.expiresAt)) return false;
    return doc.otp === inputOtp;
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-validate',
      error_data: error,
    });
    return false;
  }
};

/**
 * Manually add or update universal OTP entry.
 */
const add = async (body) => {
  try {
    const systemKey = normalizeSystem(body.system);
    if (!systemKey) {
      return createResponse(httpStatus.BAD_REQUEST, 'System is required');
    }

    const now = new Date();
    const payload = {
      system: systemKey,
      otp: body.otp ? String(body.otp).trim() : generateSixDigit(),
      generatedAt: body.generatedAt ? new Date(body.generatedAt) : now,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(now.getTime() + TTL_MS),
      generatedBy: body.generatedBy || 'manual',
      status: body.status !== undefined ? Number(body.status) : 1,
    };

    const doc = await UniversalOtp.findOneAndUpdate(
      { system: systemKey },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return createResponse(
      httpStatus.OK,
      'Universal OTP saved successfully',
      toClientRecord(doc)
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-add',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to save universal OTP'
    );
  }
};

/**
 * Get universal OTP record by MongoDB ObjectId.
 */
const getById = async (id) => {
  try {
    const doc = await UniversalOtp.findById(id);
    if (!doc) {
      return createResponse(httpStatus.NOT_FOUND, 'Universal OTP not found', null);
    }
    return createResponse(httpStatus.OK, 'Universal OTP found', toClientRecord(doc));
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-getById',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to fetch universal OTP'
    );
  }
};

/**
 * Get universal OTP record by system name.
 */
const getBySystem = async (system) => {
  try {
    const systemKey = normalizeSystem(system);
    const doc = await UniversalOtp.findOne({ system: systemKey });
    if (!doc) {
      return createResponse(httpStatus.NOT_FOUND, 'Universal OTP not found for system', null);
    }
    return createResponse(httpStatus.OK, 'Universal OTP found', toClientRecord(doc));
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-getBySystem',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to fetch universal OTP by system'
    );
  }
};

/**
 * Update universal OTP record by ID.
 */
const update = async (id, body) => {
  try {
    const updateData = {};
    if (body.otp) updateData.otp = String(body.otp).trim();
    if (body.generatedBy) updateData.generatedBy = body.generatedBy;
    if (body.generatedAt) updateData.generatedAt = new Date(body.generatedAt);
    if (body.expiresAt) updateData.expiresAt = new Date(body.expiresAt);
    if (body.status !== undefined) updateData.status = Number(body.status);

    const doc = await UniversalOtp.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!doc) {
      return createResponse(httpStatus.NOT_FOUND, 'Universal OTP record not found');
    }

    return createResponse(
      httpStatus.OK,
      'Universal OTP updated successfully',
      toClientRecord(doc)
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-update',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to update universal OTP'
    );
  }
};

/**
 * Soft delete or remove universal OTP record by ID.
 */
const deleteById = async (id) => {
  try {
    const doc = await UniversalOtp.findByIdAndUpdate(
      id,
      { $set: { status: 0 } },
      { new: true }
    );

    if (!doc) {
      return createResponse(httpStatus.NOT_FOUND, 'Universal OTP not found');
    }

    return createResponse(
      httpStatus.OK,
      'Universal OTP deactivated successfully',
      toClientRecord(doc)
    );
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-delete',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to delete universal OTP'
    );
  }
};

/**
 * List universal OTP records with search & pagination.
 */
const list = async (query = {}) => {
  try {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status !== undefined && query.status !== '') {
      filter.status = Number(query.status);
    }
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ system: searchRegex }, { otp: searchRegex }];
    }

    const [totalResults, docs] = await Promise.all([
      UniversalOtp.countDocuments(filter),
      UniversalOtp.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.ceil(totalResults / limit) || 1;

    return createResponse(httpStatus.OK, 'Universal OTPs retrieved successfully', {
      results: docs.map(toClientRecord),
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
      },
    });
  } catch (error) {
    errorHandler.errorM({
      action_type: 'universal-otp-list',
      error_data: error,
    });
    return createResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to list universal OTPs'
    );
  }
};

module.exports = {
  generate,
  getCurrent,
  isValidUniversalOtp,
  add,
  getById,
  getBySystem,
  update,
  deleteById,
  list,
};
