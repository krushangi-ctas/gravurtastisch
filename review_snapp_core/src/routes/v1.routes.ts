const express = require('express');
const authRoute = require('./v1/auth.route');
const userRoute = require('./v1/user.route');
const config = require('../config/config');
const ipRoute = require('./v1/ip.route');
const cronLogRoute = require('./v1/cron-log.route');
const emailTemplateRoute = require('./v1/email-template.route');
const systemLog = require('./v1/system-log.route');
const docsRoute = require('./v1/docs.route');
const orderListRoute = require('./v1/order-list.route');
const searchRoute = require('./v1/search.route');
const marketplaceRoutes = require('./v1/marketplace.routes');
const generalSettingRoutes = require('./v1/general-setting.routes');
const amazonCredentialRoutes = require('./v1/amazon-credentials.route');
const supportRoute = require('./v1/support.route');
const blogRoute = require('./v1/blog.route');
const universalOtpRoute = require('./v1/universal-otp.route');
const websiteConfigurationRoute = require('./v1/website-configuration.route');
const planRoute = require('./v1/plan.route');
const paymentRoute = require('./v1/payment.route');
const roleRoute = require('./v1/role.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/roles',
    route: roleRoute,
  },
  {
    path: '/ip',
    route: ipRoute,
  },
  {
    path: '/cron-log',
    route: cronLogRoute,
  },
  {
    path: '/email-template',
    route: emailTemplateRoute,
  },
  {
    path: '/system-log',
    route: systemLog,
  },
  {
    path: '/order',
    route: orderListRoute,
  },
  {
    path: '/search',
    route: searchRoute,
  },
  {
    path: '/marketplace',
    route: marketplaceRoutes,
  },
  {
    path: '/general-setting',
    route: generalSettingRoutes,
  },
  {
    path: '/amazon-credentials',
    route: amazonCredentialRoutes,
  },
  {
    path: '/support',
    route: supportRoute,
  },
  {
    path: '/blogs',
    route: blogRoute,
  },
  {
    path: '/universal-otp',
    route: universalOtpRoute,
  },
  {
    path: '/website-configuration',
    route: websiteConfigurationRoute,
  },
  {
    path: '/plans',
    route: planRoute,
  },
  {
    path: '/payments',
    route: paymentRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
