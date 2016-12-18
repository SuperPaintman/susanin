'use strict';
/** Requires */
import express            from 'express';
import exa                from 'exa';

import passport           from 'passport';

import {
  AuthLocalError
}                         from '../../../libs/error';

export const ERROR_AUTH_MISSING_CREDENTIALS = new AuthLocalError('Missing credentials', 400, null, null);
export const ERROR_AUTH_BAD_EMAIL_OR_PASSWORD = new AuthLocalError('Bad email or password', 403, null, null);

/** Init */
const router = exa(express.Router());

router.$get('/session', async function (req, res, next) {
  const isAuthenticated = req.isAuthenticated();

  if (isAuthenticated) {
    return res
      .status(200)
        .send({
          status: 'success',
          data: {
            email:          req.user.email,
            role:           req.user.role,
            authenticated:  isAuthenticated
          }
        });
  } else {
    return res
      .status(200)
        .send({
          status: 'success',
          data: {
            authenticated:  isAuthenticated
          }
        });
  }
});

router.$post('/session', async function (req, res, next) {
  passport.authenticate('local', (err, user, info, status) => {
    if (err) {
      return next(err);
    }

    if (info && info.message === 'Missing credentials' && status === 400) {
      return next(ERROR_AUTH_MISSING_CREDENTIALS);
    }

    if (!user) {
      return next(ERROR_AUTH_BAD_EMAIL_OR_PASSWORD);
    }

    req.login(user, {
      session: true
    }, (error) => {
      if (error) {
        return next(error);
      }

      return res
        .status(200)
        .send({
          status: 'success',
          data: {
            email:          req.user.email,
            role:           req.user.role,
            authenticated:  req.isAuthenticated()
          }
        });
    });
  })(req, res, next);
});

router.$delete('/session', async function (req, res, next) {
  req.logout();

  return res
    .status(200)
      .send({
        status: 'success',
        data: {
          authenticated:  req.isAuthenticated()
        }
      });
});

export default router;
