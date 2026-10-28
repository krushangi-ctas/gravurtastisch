// @ts-nocheck
const httpStatus = require('http-status');
const Section = require('../models/section.model');
const { createResponse } = require('./common.service');
const errorHandler = require('../utils/error.handler');
const { systemLog } = require('../utils/system-log');
const { isSellerOwner } = require('./permission.service');

const resolveScopeAndOwner = (actor, requestedScope) => {
  const isAdmin = Boolean(actor.isSuperAdmin || actor.userType === 'admin');
  let scope = 'admin';

  if (isAdmin) {
    scope = requestedScope === 'seller' ? 'seller' : 'admin';
  } else {
    scope = 'seller';
  }

  let ownerId = null;
  if (scope === 'seller') {
    if (isAdmin) {
      ownerId = null; // Admin managing generic seller sections or seller defaults
    } else {
      ownerId = isSellerOwner(actor) ? actor._id : actor.parentId;
    }
  }

  return { scope, ownerId, isAdmin };
};

const createSection = async (actor, body) => {
  try {
    const { scope, ownerId } = resolveScopeAndOwner(actor, body.scope);
    const normalizedName = String(body.name).trim().toLowerCase();
    const title = String(body.title).trim();

    // Check duplicate active section in same scope & owner
    const existing = await Section.findOne({
      name: normalizedName,
      scope,
      ownerId: ownerId || null,
      status: { $ne: 2 },
    });

    if (existing) {
      return createResponse(
        httpStatus.CONFLICT,
        `Section '${normalizedName}' already exists for ${scope} scope.`
      );
    }

    const permissions = {
      add: body.permissions?.add !== undefined ? Boolean(body.permissions.add) : true,
      delete: body.permissions?.delete !== undefined ? Boolean(body.permissions.delete) : true,
      update: body.permissions?.update !== undefined ? Boolean(body.permissions.update) : true,
      view: body.permissions?.view !== undefined ? Boolean(body.permissions.view) : true,
    };

    const section = await Section.create({
      name: normalizedName,
      title,
      scope,
      ownerId,
      permissions,
      status: body.status !== undefined ? Number(body.status) : 1,
    });

    await systemLog(
      'CREATE',
      section.toObject ? section.toObject() : section,
      actor._id,
      'create-section',
      {},
      section.scope
    );

    return createResponse(
      httpStatus.CREATED,
      'Section created successfully.',
      section
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'create-section', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const listSections = async (actor, query = {}) => {
  try {
    const { scope, ownerId, isAdmin } = resolveScopeAndOwner(actor, query.scope);
    const targetScope = query.scope || scope;

    const andConditions = [
      { scope: targetScope },
      { status: { $ne: 2 } },
    ];

    if (targetScope === 'seller' && !isAdmin) {
      // Sellers see their own custom sections plus platform seller defaults (ownerId null)
      andConditions.push({
        $or: [{ ownerId: ownerId || null }, { ownerId: null }],
      });
    } else if (targetScope === 'seller' && isAdmin && query.ownerId) {
      andConditions.push({ ownerId: query.ownerId });
    }

    if (query.status !== undefined && query.status !== '') {
      andConditions.push({ status: Number(query.status) });
    }

    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      andConditions.push({
        $or: [
          { name: { $regex: searchRegex } },
          { title: { $regex: searchRegex } },
        ],
      });
    }

    const finalFilter = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    const page = Number(query.page) && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) && Number(query.limit) > 0 ? Number(query.limit) : 100;
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };
    if (query.sortBy) {
      const [key, order] = query.sortBy.split(':');
      sort = { [key]: order === 'desc' ? -1 : 1 };
    }

    const [results, totalResults] = await Promise.all([
      Section.find(finalFilter).sort(sort).skip(skip).limit(limit).lean(),
      Section.countDocuments(finalFilter),
    ]);

    const totalPages = Math.ceil(totalResults / limit) || 1;

    return createResponse(
      httpStatus.OK,
      'Sections fetched successfully.',
      results,
      {
        pagination: {
          page,
          limit,
          totalPages,
          lastPage: totalPages,
          totalResults,
          length: results.length,
        },
      }
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'list-sections', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const getSectionById = async (actor, sectionId) => {
  try {
    const section = await Section.findOne({
      _id: sectionId,
      status: { $ne: 2 },
    });

    if (!section) {
      return createResponse(httpStatus.NOT_FOUND, 'Section not found.');
    }

    return createResponse(
      httpStatus.OK,
      'Section fetched successfully.',
      section
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'get-section', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const updateSection = async (actor, sectionId, body) => {
  try {
    const section = await Section.findOne({
      _id: sectionId,
      status: { $ne: 2 },
    });

    if (!section) {
      return createResponse(httpStatus.NOT_FOUND, 'Section not found.');
    }

    const existingData = section.toObject
      ? section.toObject()
      : JSON.parse(JSON.stringify(section));

    // If name is changing, check uniqueness
    if (body.name) {
      const normalizedName = String(body.name).trim().toLowerCase();
      if (normalizedName !== section.name) {
        const existing = await Section.findOne({
          _id: { $ne: sectionId },
          name: normalizedName,
          scope: section.scope,
          ownerId: section.ownerId || null,
          status: { $ne: 2 },
        });

        if (existing) {
          return createResponse(
            httpStatus.CONFLICT,
            `Section '${normalizedName}' already exists for ${section.scope} scope.`
          );
        }
        section.name = normalizedName;
      }
    }

    if (body.title !== undefined) {
      section.title = String(body.title).trim();
    }

    if (body.status !== undefined) {
      section.status = Number(body.status);
    }

    if (body.permissions) {
      section.permissions = {
        add:
          body.permissions.add !== undefined
            ? Boolean(body.permissions.add)
            : section.permissions?.add || false,
        delete:
          body.permissions.delete !== undefined
            ? Boolean(body.permissions.delete)
            : section.permissions?.delete || false,
        update:
          body.permissions.update !== undefined
            ? Boolean(body.permissions.update)
            : section.permissions?.update || false,
        view:
          body.permissions.view !== undefined
            ? Boolean(body.permissions.view)
            : section.permissions?.view || false,
      };
    }

    await section.save();

    await systemLog(
      'UPDATE',
      section.toObject ? section.toObject() : section,
      actor._id,
      'update-section',
      existingData,
      section.scope
    );

    return createResponse(
      httpStatus.OK,
      'Section updated successfully.',
      section
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'update-section', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const deleteSection = async (actor, sectionId) => {
  try {
    const section = await Section.findOne({
      _id: sectionId,
      status: { $ne: 2 },
    });

    if (!section) {
      return createResponse(httpStatus.NOT_FOUND, 'Section not found.');
    }

    section.status = 2; // soft-delete
    await section.save();

    await systemLog(
      'DELETE',
      section.toObject ? section.toObject() : section,
      actor._id,
      'delete-section',
      {},
      section.scope
    );

    return createResponse(
      httpStatus.OK,
      'Section deleted successfully.',
      {}
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'delete-section', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

const toggleStatus = async (actor, sectionId, status) => {
  try {
    const section = await Section.findOne({
      _id: sectionId,
      status: { $ne: 2 },
    });

    if (!section) {
      return createResponse(httpStatus.NOT_FOUND, 'Section not found.');
    }

    const previousStatus = section.status;
    section.status = Number(status) === 1 ? 1 : 0;
    await section.save();

    await systemLog(
      'UPDATE',
      section.toObject ? section.toObject() : section,
      actor._id,
      'active-deactive-section',
      { status: previousStatus },
      section.scope
    );

    return createResponse(
      httpStatus.OK,
      `Section status ${section.status === 1 ? 'activated' : 'deactivated'} successfully.`,
      section
    );
  } catch (error) {
    errorHandler.errorM({ action_type: 'toggle-section-status', error_data: error });
    return createResponse(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  createSection,
  listSections,
  getSectionById,
  updateSection,
  deleteSection,
  toggleStatus,
  resolveScopeAndOwner,
};
