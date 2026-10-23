const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');

const jwtFromRequest = (req) => {
  let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (token) {
    token = token.replace(/^["']+|["']+$/g, '').trim();
  }
  return token;
};

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest,
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      const customer = await Customer.findById(payload.id);
      if (!customer) {
        return done(null, false);
      }
      return done(null, customer);
      // return done(null, false); // Commet out and on
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
