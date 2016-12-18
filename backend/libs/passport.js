'use strict';
/** Requires */
import passport               from 'passport';
import {
  Strategy as LocalStrategy
}                             from 'passport-local';

import logger                 from './logger';
import {
  AuthLocalError,
  AccountError
}                             from './error';

import User                   from '../models/user';
import {
  DEFAULT_PASSWOD_HASH_TYPE
}                             from '../models/user';

/** Constant */
export const ERROR_AUTH_MISSING_EMAIL    = (email, password) => new AuthLocalError('Missing email', 400, email, password);
export const ERROR_AUTH_MISSING_PASSWORD = (email, password) => new AuthLocalError('Missing passport', 400, email, password);
export const ERROR_AUTH_BAD_EMAIL_OR_PASSWORD = (email, password) => new AuthLocalError('Bad email or password', 403, email, password);
export const ERROR_ACCOUNT_IS_NOT_ACTIVATED = (user) => new AccountError('Account is not activated', 403, user);


/** Init */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Local
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (email, password, done) => {
  (async function () {
    if (!email) {
      const err = ERROR_AUTH_MISSING_EMAIL(email, password);
      logger.info('auth local:', err.message);

      return done(err, false);
    }

    if (!password) {
      const err = ERROR_AUTH_MISSING_PASSWORD(email, password);
      logger.info('auth local:', err.message);
      
      return done(err, false);
    }

    const user = await User.findOne({
      email: email
    });

    if (!user) {
      const err = ERROR_AUTH_BAD_EMAIL_OR_PASSWORD(email, password);

      logger.info('auth local:', 'No user with this credentials', {
        email
      });

      return done(err, false);
    }

    const isValidPassword = await user.isValidPassword(password);
    if (!isValidPassword) {
      const err = ERROR_AUTH_BAD_EMAIL_OR_PASSWORD(email, password);

      logger.info('auth local:', 'Bad password for email:', {
        email
      });

      return done(err, false);
    }

    // Update hash type if it is deprecated
    if (isValidPassword && user.hashType !== DEFAULT_PASSWOD_HASH_TYPE) {
      logger.info(`update password hash type for "${email}": "${user._hashType}" -> "${DEFAULT_PASSWOD_HASH_TYPE}"`);

      user.password = password;
      await user.save();
    }

    if (!user.isActive) {
      const err = new ERROR_ACCOUNT_IS_NOT_ACTIVATED(user);

      logger.info('auth local:', err.message, {
        email
      });

      return done(err, false);
    }

    logger.info('auth local:', email);

    return done(null, user);
  })()
    .catch((err) => done(err));
}));

export default passport;
