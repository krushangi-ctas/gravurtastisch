// @ts-nocheck
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            'Password must contain at least one letter and one number'
          );
        }
      },
      private: true, // used by the toJSON plugin
    },
    role_id: {
      type: mongoose.Types.ObjectId,
      ref: 'tbl_roles',
      default: null,
    },
    /**
     * admin  = platform staff (managed by superAdmin)
     * seller = seller org members (sellerAdmin + sellerUsers)
     */
    userType: {
      type: String,
      enum: ['admin', 'seller'],
      default: 'seller',
      index: true,
    },
    /**
     * Seller organization owner. Not listed in seller team listings.
     * Full seller-side access without role checks.
     */
    isSellerAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    /**
     * Parent sellerAdmin for sellerUsers. Null for sellerAdmin / admin users.
     */
    parentId: {
      type: mongoose.Types.ObjectId,
      ref: 'tbl_users',
      default: null,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    reset_id: {
      type: String,
      trim: true,
    },
    expiration: {
      type: Date,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      trim: true,
    },
    contact_no: {
      type: String,
      trim: true,
    },
    marketplaces: {
      type: [String],
      default: [],
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    planLimits: {
      maxMarketplaces: {
        type: Number,
        default: 5,
      },
      maxReviewRequestsPerMonth: {
        type: Number,
        default: 1000,
      },
    },
    currentPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tbl_plans',
      default: null,
    },
    stripeCustomerId: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'past_due', 'canceled', 'incomplete'],
      default: 'none',
    },
    status: {
      type: Number,
      default: 1, // 0 - INACTIVE, 1 - ACTIVE, 2 - DELETE
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const user = this.getUpdate();
  if (user.password) {
    this.getUpdate().password = await bcrypt.hash(user.password, 8);
  }
  next();
});
/**
 * @typedef User
 */
const User = mongoose.model('tbl_users', userSchema);

module.exports = User;
