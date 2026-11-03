const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number(),
    SITE_URL: Joi.string().allow('').default('http://localhost:7051'),
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    // Amazon SP-API credentials: allow empty/optional so missing env vars don't crash the server on startup.
    AMAZON_CLIENT_ID: Joi.string().allow('').default(''),
    AMAZON_CLIENT_SECRET: Joi.string().allow('').default(''),
    AMAZON_REFRESH_TOKEN: Joi.string().allow('').default(''),
    AMAZON_SELLER_ID: Joi.string().allow('').default(''),
    MARKETPLACE_ID: Joi.string().allow('').default(''),
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
  port: envVars.PORT || 3002,
  coreApiUrl: (envVars.SITE_URL || 'http://localhost:7051').trim(),
  // Betriebsdaten (Layouts, Zeitplan, Ledger, Sitzung …) — getrennt vom Code, seit 24.10.2026.
  // [EN] Operational data (layouts, schedule, ledger, session ...) — separated from code since Oct 24, 2026.
  datenDir: path.join(__dirname, 'daten'),
  amz: {
    clientId: envVars.AMAZON_CLIENT_ID || '',
    clientSecret: envVars.AMAZON_CLIENT_SECRET || '',
    refreshToken: envVars.AMAZON_REFRESH_TOKEN || '',
    sellerId: envVars.AMAZON_SELLER_ID || '',
    marketplaceId: envVars.MARKETPLACE_ID || '',
    amz_auth_url: 'https://api.amazon.com/auth/o2/token',
    amz_sp_api_base_url: 'https://sellingpartnerapi-eu.amazon.com',
  },
};
