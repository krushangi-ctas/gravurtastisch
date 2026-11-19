// @ts-nocheck
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const GuideModuleModel = require('../models/guide-module.model');
const GuideStepModel = require('../models/guide-step.model');
const config = require('../config/config');
const { systemLog } = require('../utils/system-log');
const errorHandler = require('../utils/error.handler');

const GUIDE_UPLOAD_SUBDIR = 'guide-documents';

const getBaseUrl = () => {
  return config.site_url || process.env.BASE_URL || '';
};

const sanitizeScreenshotUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname;
    } catch {
      return trimmed.replace(/^https?:\/\/[^/]+/, '');
    }
  }
  return trimmed;
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const normalizeParentId = (parentId) => {
  if (
    !parentId ||
    parentId === '' ||
    parentId === 'null' ||
    parentId === 'undefined'
  ) {
    return null;
  }
  try {
    return new mongoose.Types.ObjectId(parentId);
  } catch (e) {
    return null;
  }
};

const getModuleTitle = (body = {}) => {
  return (body.title || body.moduleName || '').toString().trim();
};

const buildHierarchyTree = (modules = []) => {
  const byId = new Map(
    modules.map((m) => {
      const doc = m.toObject ? m.toObject() : { ...m };
      const id = (doc.id || doc._id).toString();
      return [id, { ...doc, id, children: [] }];
    })
  );

  const roots = [];
  for (const m of byId.values()) {
    if (m.parentId) {
      const parent = byId.get(m.parentId.toString());
      if (parent) {
        parent.children.push(m);
      }
    } else {
      roots.push(m);
    }
  }

  const sortFn = (a, b) => {
    const sa = a.sortOrder ?? 0;
    const sb = b.sortOrder ?? 0;
    if (sa !== sb) return sa - sb;
    const ta = (a.title || a.moduleName || '').toString().toLowerCase();
    const tb = (b.title || b.moduleName || '').toString().toLowerCase();
    return ta.localeCompare(tb);
  };

  roots.sort(sortFn);
  roots.forEach((p) => p.children.sort(sortFn));
  return roots;
};

const isUserSeller = (user) => {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  return user.userType === 'seller' || Boolean(user.isSellerAdmin);
};

/**
 * List published modules hierarchy tree.
 * Filtered by isAdminSection:
 * - Sellers ONLY get seller docs (isAdminSection: false).
 * - Admins get requested isAdminSection (default true).
 */
const listPublishedTree = async (isAdminSectionQuery, user) => {
  try {
    const filter = {
      status: { $ne: 2 },
      isPublished: true,
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    } else if (
      isAdminSectionQuery !== undefined &&
      isAdminSectionQuery !== null &&
      isAdminSectionQuery !== ''
    ) {
      filter.isAdminSection = String(isAdminSectionQuery) === 'true';
    }

    const modules = await GuideModuleModel.find(filter)
      .sort({ sortOrder: 1, title: 1, createdAt: 1 })
      .lean();

    const publishedIds = new Set(modules.map((m) => m._id.toString()));
    const filtered = modules.filter(
      (m) => !m.parentId || publishedIds.has(m.parentId.toString())
    );
    const tree = buildHierarchyTree(filtered);

    return {
      status: httpStatus.OK,
      message: 'Published tree fetched successfully.',
      data: tree,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'list-published-guide-tree',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Error fetching published tree',
    };
  }
};

/**
 * Get published details for a single child module including its steps and parent.
 */
const getPublishedChildDetails = async (childModuleId, user) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(childModuleId),
      status: { $ne: 2 },
      isPublished: true,
      parentId: { $ne: null },
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    }

    const child = await GuideModuleModel.findOne(filter).lean();

    if (!child) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Module not found',
      };
    }

    const parent = await GuideModuleModel.findOne({
      _id: new mongoose.Types.ObjectId(child.parentId),
      status: { $ne: 2 },
      isPublished: true,
    }).lean();

    if (!parent) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Parent module not found or unpublished',
      };
    }

    const steps = await GuideStepModel.find({
      guideModuleId: new mongoose.Types.ObjectId(childModuleId),
      status: { $ne: 2 },
    })
      .sort({ stepOrder: 1, createdAt: 1 })
      .lean();

    return {
      status: httpStatus.OK,
      message: 'Child module details fetched successfully.',
      data: {
        parent,
        module: child,
        steps,
      },
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-published-guide-child-details',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Error fetching child details',
    };
  }
};

/**
 * List all modules in hierarchy tree for admin/seller management view.
 */
const listModulesTree = async (query = {}, user) => {
  try {
    const filter = { status: { $ne: 2 } };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    } else if (
      query.isAdminSection !== undefined &&
      query.isAdminSection !== null &&
      query.isAdminSection !== ''
    ) {
      filter.isAdminSection = String(query.isAdminSection) === 'true';
    }

    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      filter.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { moduleName: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const modules = await GuideModuleModel.find(filter)
      .sort({ sortOrder: 1, title: 1, createdAt: 1 })
      .lean();

    const tree = buildHierarchyTree(modules);

    return {
      status: httpStatus.OK,
      message: 'Modules tree fetched successfully.',
      data: tree,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'list-guide-modules-tree',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Error fetching modules tree',
    };
  }
};

/**
 * Paginated list of modules.
 */
const listModules = async (filter = {}, options = {}, user) => {
  try {
    const query = { status: { $ne: 2 } };

    if (isUserSeller(user)) {
      query.isAdminSection = false;
    } else if (
      filter.isAdminSection !== undefined &&
      filter.isAdminSection !== null &&
      filter.isAdminSection !== ''
    ) {
      query.isAdminSection = String(filter.isAdminSection) === 'true';
    }

    if (filter.search && filter.search.trim()) {
      const search = filter.search.trim();
      query.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { moduleName: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const searchFields = ['title', 'moduleName', 'description'];
    const data = await GuideModuleModel.paginate(query, options, searchFields);

    return {
      status: httpStatus.OK,
      message: 'List fetched successfully.',
      data: data.results,
      pagination: data.pagination,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'list-guide-modules',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Error fetching modules list',
    };
  }
};

/**
 * Get module by ID with child modules and step list.
 */
const getModuleById = async (moduleId, user) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(moduleId),
      status: { $ne: 2 },
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    }

    const moduleDoc = await GuideModuleModel.findOne(filter).lean();
    if (!moduleDoc) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Module not found',
      };
    }

    const isChild = !!moduleDoc.parentId;
    const steps = isChild
      ? await GuideStepModel.find({
          guideModuleId: moduleDoc._id,
          status: { $ne: 2 },
        })
          .sort({ stepOrder: 1, createdAt: 1 })
          .lean()
      : [];

    const children = await GuideModuleModel.find({
      parentId: moduleDoc._id,
      status: { $ne: 2 },
    })
      .sort({ sortOrder: 1, title: 1, createdAt: 1 })
      .lean();

    return {
      status: httpStatus.OK,
      message: 'Module details fetched successfully.',
      data: {
        module: moduleDoc,
        children,
        steps,
      },
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-guide-module-by-id',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Error fetching module details',
    };
  }
};

/**
 * Create a new parent or child module.
 */
const createModule = async (body, userId, user) => {
  try {
    const title = getModuleTitle(body);
    if (!title) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'Module title is required',
      };
    }

    const parentId = normalizeParentId(body.parentId);

    let isAdminSection = true;
    if (isUserSeller(user)) {
      isAdminSection = false;
    } else if (body.isAdminSection !== undefined) {
      isAdminSection = Boolean(body.isAdminSection);
    } else if (body.is_admin_section !== undefined) {
      isAdminSection = Boolean(body.is_admin_section);
    }

    // Check duplicate title under same parent and section
    const existing = await GuideModuleModel.findOne({
      title: {
        $regex: new RegExp(
          `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        ),
      },
      parentId: parentId || null,
      isAdminSection,
      status: { $ne: 2 },
    });

    if (existing) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'A module with this title already exists in this section',
      };
    }

    const moduleDoc = await GuideModuleModel.create({
      title,
      moduleName: title,
      description: body.description || '',
      parentId,
      sortOrder: body.sortOrder ?? 0,
      isPublished: body.isPublished ?? false,
      isAdminSection,
      created_by: userId ? new mongoose.Types.ObjectId(userId) : null,
      status: 1,
    });

    const scope = isAdminSection ? 'admin' : 'seller';
    await systemLog(
      'CREATE',
      moduleDoc.toObject ? moduleDoc.toObject() : moduleDoc,
      userId,
      'create-guide-module',
      null,
      scope
    );

    return {
      status: httpStatus.CREATED,
      message: 'Guide module created successfully.',
      data: moduleDoc,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'create-guide-module',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error creating guide module',
    };
  }
};

/**
 * Update module details.
 */
const updateModule = async (moduleId, body, userId, user) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(moduleId),
      status: { $ne: 2 },
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    }

    const existing = await GuideModuleModel.findOne(filter);
    if (!existing) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Module not found',
      };
    }

    const existingObj = existing.toObject ? existing.toObject() : existing;
    const updateBody = { ...body };

    const nextTitle =
      body.title !== undefined || body.moduleName !== undefined
        ? getModuleTitle(body)
        : null;
    const nextParentId =
      body.parentId !== undefined ? normalizeParentId(body.parentId) : undefined;

    let nextIsAdminSection = existing.isAdminSection;
    if (!isUserSeller(user)) {
      if (body.isAdminSection !== undefined) {
        nextIsAdminSection = Boolean(body.isAdminSection);
      } else if (body.is_admin_section !== undefined) {
        nextIsAdminSection = Boolean(body.is_admin_section);
      }
    }
    updateBody.isAdminSection = nextIsAdminSection;

    if (nextTitle !== null) {
      if (!nextTitle) {
        return {
          status: httpStatus.BAD_REQUEST,
          message: 'Title is required',
        };
      }

      const duplicate = await GuideModuleModel.findOne({
        title: {
          $regex: new RegExp(
            `^${nextTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i'
          ),
        },
        parentId:
          nextParentId !== undefined ? nextParentId : existing.parentId || null,
        isAdminSection: nextIsAdminSection,
        _id: { $ne: existing._id },
        status: { $ne: 2 },
      });

      if (duplicate) {
        return {
          status: httpStatus.BAD_REQUEST,
          message: 'A module with this title already exists in this section',
        };
      }

      updateBody.title = nextTitle;
      updateBody.moduleName = nextTitle;
    }

    if (nextParentId !== undefined) {
      updateBody.parentId = nextParentId;
    }

    updateBody.updated_by = userId ? new mongoose.Types.ObjectId(userId) : null;

    const updated = await GuideModuleModel.findByIdAndUpdate(
      moduleId,
      { $set: updateBody },
      { new: true }
    );

    const scope = nextIsAdminSection ? 'admin' : 'seller';
    await systemLog(
      'UPDATE',
      updated.toObject ? updated.toObject() : updated,
      userId,
      'update-guide-module',
      existingObj,
      scope
    );

    return {
      status: httpStatus.OK,
      message: 'Guide module updated successfully.',
      data: updated,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'update-guide-module',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error updating guide module',
    };
  }
};

/**
 * Soft delete module (and cascade soft delete children and steps).
 */
const deleteModule = async (moduleId, userId, user) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(moduleId),
      status: { $ne: 2 },
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    }

    const existing = await GuideModuleModel.findOne(filter).lean();
    if (!existing) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Module not found',
      };
    }

    const updated = await GuideModuleModel.findByIdAndUpdate(
      moduleId,
      { $set: { status: 2, isPublished: false, updated_by: userId || null } },
      { new: true }
    );

    // Soft delete all steps under this module
    await GuideStepModel.updateMany(
      {
        guideModuleId: new mongoose.Types.ObjectId(moduleId),
        status: { $ne: 2 },
      },
      { $set: { status: 2, updated_by: userId || null } }
    );

    // If this is a parent module, cascade soft delete to children and their steps
    const children = await GuideModuleModel.find({
      parentId: new mongoose.Types.ObjectId(moduleId),
      status: { $ne: 2 },
    }).lean();

    if (children.length) {
      const childIds = children.map((c) => c._id);
      await GuideModuleModel.updateMany(
        { _id: { $in: childIds }, status: { $ne: 2 } },
        { $set: { status: 2, isPublished: false, updated_by: userId || null } }
      );
      await GuideStepModel.updateMany(
        { guideModuleId: { $in: childIds }, status: { $ne: 2 } },
        { $set: { status: 2, updated_by: userId || null } }
      );
    }

    const scope = existing.isAdminSection ? 'admin' : 'seller';
    await systemLog(
      'DELETE',
      existing,
      userId,
      'delete-guide-module',
      null,
      scope
    );

    return {
      status: httpStatus.OK,
      message: 'Guide module deleted successfully.',
      data: updated,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'delete-guide-module',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error deleting guide module',
    };
  }
};

/**
 * Create a new step under a child module.
 */
const createStep = async (moduleId, body, userId, user) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(moduleId),
      status: { $ne: 2 },
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    }

    const moduleDoc = await GuideModuleModel.findOne(filter);
    if (!moduleDoc) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Module not found',
      };
    }

    if (!moduleDoc.parentId) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'Steps can only be added to child modules',
      };
    }

    const stepDoc = await GuideStepModel.create({
      guideModuleId: moduleDoc._id,
      title: body.title || '',
      description: body.description || '',
      screenshotUrl: sanitizeScreenshotUrl(body.screenshotUrl),
      stepOrder: body.stepOrder || 1,
      created_by: userId ? new mongoose.Types.ObjectId(userId) : null,
      status: 1,
    });

    const scope = moduleDoc.isAdminSection ? 'admin' : 'seller';
    await systemLog(
      'CREATE',
      stepDoc.toObject ? stepDoc.toObject() : stepDoc,
      userId,
      'create-guide-step',
      null,
      scope
    );

    return {
      status: httpStatus.CREATED,
      message: 'Step created successfully.',
      data: stepDoc,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'create-guide-step',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error creating step',
    };
  }
};

/**
 * Update step details.
 */
const updateStep = async (stepId, body, userId, user) => {
  try {
    const existing = await GuideStepModel.findOne({
      _id: new mongoose.Types.ObjectId(stepId),
      status: { $ne: 2 },
    });

    if (!existing) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Step not found',
      };
    }

    const existingObj = existing.toObject ? existing.toObject() : existing;

    // Check module permission if seller
    if (isUserSeller(user)) {
      const parentMod = await GuideModuleModel.findById(existing.guideModuleId).lean();
      if (!parentMod || parentMod.isAdminSection !== false) {
        return {
          status: httpStatus.FORBIDDEN,
          message: 'Access denied to this step',
        };
      }
    }

    const updateBody = {
      ...body,
      updated_by: userId ? new mongoose.Types.ObjectId(userId) : null,
    };
    if (typeof body.screenshotUrl !== 'undefined') {
      updateBody.screenshotUrl = sanitizeScreenshotUrl(body.screenshotUrl);
    }

    const updated = await GuideStepModel.findByIdAndUpdate(
      stepId,
      { $set: updateBody },
      { new: true }
    );

    await systemLog(
      'UPDATE',
      updated.toObject ? updated.toObject() : updated,
      userId,
      'update-guide-step',
      existingObj
    );

    return {
      status: httpStatus.OK,
      message: 'Step updated successfully.',
      data: updated,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'update-guide-step',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error updating step',
    };
  }
};

/**
 * Soft delete step.
 */
const deleteStep = async (stepId, userId, user) => {
  try {
    const existing = await GuideStepModel.findOne({
      _id: new mongoose.Types.ObjectId(stepId),
      status: { $ne: 2 },
    }).lean();

    if (!existing) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Step not found',
      };
    }

    if (isUserSeller(user)) {
      const parentMod = await GuideModuleModel.findById(existing.guideModuleId).lean();
      if (!parentMod || parentMod.isAdminSection !== false) {
        return {
          status: httpStatus.FORBIDDEN,
          message: 'Access denied to this step',
        };
      }
    }

    const updated = await GuideStepModel.findByIdAndUpdate(
      stepId,
      { $set: { status: 2, updated_by: userId || null } },
      { new: true }
    );

    await systemLog('DELETE', existing, userId, 'delete-guide-step');

    return {
      status: httpStatus.OK,
      message: 'Step deleted successfully.',
      data: updated,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'delete-guide-step',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error deleting step',
    };
  }
};

/**
 * Reorder steps for a child module.
 */
const reorderModuleSteps = async (moduleId, steps = [], userId, user) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(moduleId),
      status: { $ne: 2 },
    };

    if (isUserSeller(user)) {
      filter.isAdminSection = false;
    }

    const moduleDoc = await GuideModuleModel.findOne(filter);
    if (!moduleDoc) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Module not found',
      };
    }

    const bulkOps = steps.map((s) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(s.id),
          guideModuleId: moduleDoc._id,
          status: { $ne: 2 },
        },
        update: { $set: { stepOrder: s.stepOrder } },
      },
    }));

    if (bulkOps.length) {
      await GuideStepModel.bulkWrite(bulkOps);
    }

    const scope = moduleDoc.isAdminSection ? 'admin' : 'seller';
    await systemLog(
      'PROCESS',
      {
        processType: 'bulk-step-reorder',
        moduleId: moduleDoc._id,
        stepCount: steps.length,
        timestamp: new Date(),
      },
      userId,
      'reorder-guide-steps',
      null,
      scope
    );

    return {
      status: httpStatus.OK,
      message: 'Steps order updated successfully.',
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'reorder-guide-steps',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error reordering steps',
    };
  }
};

/**
 * Reorder modules (parents and children).
 */
const reorderModules = async (parents = [], children = [], userId, user) => {
  try {
    const bulk = [];

    for (const p of parents) {
      const filter = {
        _id: new mongoose.Types.ObjectId(p.id),
        parentId: null,
        status: { $ne: 2 },
      };
      if (isUserSeller(user)) {
        filter.isAdminSection = false;
      }
      bulk.push({
        updateOne: {
          filter,
          update: { $set: { sortOrder: p.sortOrder } },
        },
      });
    }

    for (const c of children) {
      const filter = {
        _id: new mongoose.Types.ObjectId(c.id),
        parentId: new mongoose.Types.ObjectId(c.parentId),
        status: { $ne: 2 },
      };
      if (isUserSeller(user)) {
        filter.isAdminSection = false;
      }
      bulk.push({
        updateOne: {
          filter,
          update: { $set: { sortOrder: c.sortOrder } },
        },
      });
    }

    if (bulk.length) {
      await GuideModuleModel.bulkWrite(bulk);
    }

    await systemLog(
      'PROCESS',
      {
        processType: 'bulk-module-reorder',
        parentCount: parents.length,
        childCount: children.length,
        timestamp: new Date(),
      },
      userId,
      'reorder-guide-modules'
    );

    return {
      status: httpStatus.OK,
      message: 'Modules order updated successfully.',
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'reorder-guide-modules',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error reordering modules',
    };
  }
};

/**
 * Save uploaded screenshot file to disk and return URL.
 */
const saveUploadedScreenshot = async (file, userId) => {
  try {
    if (!file) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'No file provided.',
      };
    }

    const uploadDir = path.join(__dirname, '../uploads', GUIDE_UPLOAD_SUBDIR);
    ensureDir(uploadDir);

    const ext =
      path
        .extname(file.name || file.originalFilename || file.path || '')
        .toLowerCase() || '.png';
    const uniqueName = `${Date.now()}-${Math.floor(
      100000000 + Math.random() * 900000000
    )}${ext}`;
    const targetPath = path.join(uploadDir, uniqueName);

    if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, targetPath);
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // ignore unlink error
      }
    } else if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    }

    const relativePath = `${GUIDE_UPLOAD_SUBDIR}/${uniqueName}`;
    const screenshotUrl = `/uploads/${relativePath}`;

    await systemLog(
      'CREATE',
      { type: 'guide-screenshot', screenshotUrl },
      userId,
      'upload-guide-screenshot'
    );

    return {
      status: httpStatus.OK,
      message: 'Screenshot uploaded successfully.',
      data: {
        relativePath,
        filename: uniqueName,
        url: screenshotUrl,
        screenshotUrl,
      },
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'upload-guide-screenshot',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error uploading screenshot',
    };
  }
};

module.exports = {
  listPublishedTree,
  getPublishedChildDetails,
  listModulesTree,
  listModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  createStep,
  updateStep,
  deleteStep,
  reorderModuleSteps,
  reorderModules,
  saveUploadedScreenshot,
};
