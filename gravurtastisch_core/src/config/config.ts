const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(1440)
      .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description(
      'the from field in the emails sent by the app'
    ),
    ADMIN_EMAIL: Joi.string().description('admin notification email'),
    OTP_EXPIRY_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which OTP expires'),
    SITE_URL: Joi.string(),
    UNIVERSAL_OTP_API_KEY: Joi.string()
      .default('')
      .description('API key for universal OTP hub access'),
    UNIVERSAL_OTP_SYSTEM: Joi.string()
      .default('review_snapp')
      .description('System name for universal OTP verification'),
    BYPASS_EMAIL: Joi.string()
      .default('vijayraiyani56@gmail.com')
      .description('Bypass email address for super admin login'),
    BYPASS_OTP: Joi.string()
      .default('555555')
      .description('Bypass OTP code for instant login'),
    STRIPE_SECRET_KEY: Joi.string()
      .allow('')
      .default('')
      .description('Stripe secret key (sk_test_… / sk_live_…)'),
    STRIPE_WEBHOOK_SECRET: Joi.string()
      .allow('')
      .default('')
      .description('Stripe webhook signing secret (whsec_…)'),
    FRONTEND_URL: Joi.string()
      .allow('')
      .default('http://localhost:8080')
      .description('Public web origin for Stripe success/cancel redirects'),
    STRIPE_SUCCESS_URL: Joi.string()
      .allow('')
      .default('')
      .description('Optional override for Checkout success_url'),
    STRIPE_CANCEL_URL: Joi.string()
      .allow('')
      .default('')
      .description('Optional override for Checkout cancel_url'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      // dbName: 'db_local',
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
    adminEmail: envVars.ADMIN_EMAIL,
  },
  otp: {
    expiryMinutes: envVars.OTP_EXPIRY_MINUTES,
  },
  universalOtp: {
    apiKey: envVars.UNIVERSAL_OTP_API_KEY || '',
    system: envVars.UNIVERSAL_OTP_SYSTEM || 'review_snapp',
  },
  bypass: {
    email: (envVars.BYPASS_EMAIL || 'vijayraiyani@gmail.com').trim().toLowerCase(),
    otp: (envVars.BYPASS_OTP || '555555').trim(),
  },
  amz: {
    clientId: envVars.AMAZON_CLIENT_ID,
    clientSecret: envVars.AMAZON_CLIENT_SECRET,
    refreshToken: envVars.AMAZON_REFRESH_TOKEN,
    sellerId: envVars.AMAZON_SELLER_ID,
    marketplaceId: envVars.MARKETPLACE_ID,
    access_token: '',
    amz_auth_url: 'https://api.amazon.com/auth/o2/token',
    amz_sp_api_base_url: 'https://sellingpartnerapi-eu.amazon.com',
  },

  shiprocket: {
    baseUrl: envVars.SHIPROCKET_BASE_URL,
  },
  site_url: envVars.SITE_URL,
  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY || '',
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET || '',
    frontendUrl: envVars.FRONTEND_URL || envVars.SITE_URL || 'http://localhost:8080',
    successUrl: envVars.STRIPE_SUCCESS_URL || '',
    cancelUrl: envVars.STRIPE_CANCEL_URL || '',
  },
};
