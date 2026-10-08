// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const permissionSchema = mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
    },
    canView: { type: Boolean, default: false },
    canCreate: { type: Boolean, default: false },
    canUpdate: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    scope: {
      type: String,
      enum: ['admin', 'seller'],
      required: true,
      index: true,
    },
    /**
     * Seller-scoped custom roles belong to a sellerAdmin account.
     * Admin-scoped roles keep this null.
     */
    ownerId: {
      type: mongoose.Types.ObjectId,
      ref: 'tbl_users',
      default: null,
      index: true,
    },
    permissions: {
      type: [permissionSchema],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      default: 1, // 0 inactive, 1 active, 2 deleted
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.index(
  { role_name: 1, scope: 1, ownerId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 2 } } }
);

roleSchema.plugin(toJSON);
roleSchema.plugin(paginate);

/**
 * @typedef Role
 */
const Role = mongoose.model('tbl_roles', roleSchema);

module.exports = Role;
