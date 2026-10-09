const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const validate = (schema) => async (req, res, next) => {
  // Use async function here
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));

  try {
    // Use validateAsync to handle asynchronous validation
    const { value, error } = await Joi.object(validSchema) // Use await here
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validateAsync(object); // Use validateAsync here

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(', ');
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, value);
    return next();
  } catch (error) {
    return next(new ApiError(httpStatus.BAD_REQUEST, error.message));
  }
};

module.exports = validate;
