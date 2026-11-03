const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number(),
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    // Amazon-Credentials beim Start prüfen — fehlt eine, schlug vorher erst der
    // Token-Abruf zur Laufzeit fehl (kryptischer 400er statt klarer Startfehler).
    // [EN] Validate Amazon credentials at startup — if any is missing, previously token
    // [EN] retrieval failed only at runtime (cryptic 400 instead of clear startup error).
    AMAZON_CLIENT_ID: Joi.string().required(),
    AMAZON_CLIENT_SECRET: Joi.string().required(),
    AMAZON_REFRESH_TOKEN: Joi.string().required(),
    AMAZON_SELLER_ID: Joi.string().required(),
    MARKETPLACE_ID: Joi.string().required(),
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
  // Betriebsdaten (Layouts, Zeitplan, Ledger, Sitzung …) — getrennt vom Code, seit 24.10.2026.
  // [EN] Operational data (layouts, schedule, ledger, session ...) — separated from code since Oct 24, 2026.
  datenDir: path.join(__dirname, 'daten'),
  amz: {
    clientId: envVars.AMAZON_CLIENT_ID,
    clientSecret: envVars.AMAZON_CLIENT_SECRET,
    refreshToken: envVars.AMAZON_REFRESH_TOKEN,
    sellerId: envVars.AMAZON_SELLER_ID,
    marketplaceId: envVars.MARKETPLACE_ID,
    amz_auth_url: 'https://api.amazon.com/auth/o2/token',
    amz_sp_api_base_url: 'https://sellingpartnerapi-eu.amazon.com',
  },
};
