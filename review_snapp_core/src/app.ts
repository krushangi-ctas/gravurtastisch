const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1.routes');
const paymentController = require('./controllers/payment.controller');
const { errorConverter, errorHandler } = require('./middlewares/error');

const ApiError = require('./utils/ApiError');
const app = express();

// Set up view engine for server-side rendering
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

/**
 * Stripe webhook MUST receive the raw body for signature verification.
 * Mount before express.json().
 */
app.post(
  '/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

// parse json request body
app.use(express.json({ limit: '500mb' }));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// sanitize request data
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

app.use(express.static(`${__dirname}/uploads`));
app.use(express.static(`${__dirname}/../public`));

// CORS configuration
app.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,PUT,PATCH,POST,DELETE,OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
    'usertimezone'
  );
  next();
});

// jwt authentication
app.use(passport.initialize());
// Increase body size limits
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes  PRIVATE APIs
app.use('/v1', routes);

// Serve the search interface at root
app.get('/', (req, res) => {
  res.redirect('/v1/search');
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);
module.exports = app;
