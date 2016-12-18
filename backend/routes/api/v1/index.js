'use strict';
/** Requires */
import express            from 'express';
import exa                from 'exa';

import _                  from 'lodash';

import passport           from 'passport';

import * as policies      from '../../../policies';

import Link               from '../../../models/link';
import Following          from '../../../models/following';

import {
  AuthLocalError,
  NotFoundError,
  ValidationError
}                         from '../../../libs/error';

/** Constants */
export const ERROR_LINK_NOT_FOUND = new NotFoundError('Link not found');
export const ERROR_AUTH_MISSING_CREDENTIALS = new AuthLocalError('Missing credentials', 400, null, null);
export const ERROR_AUTH_BAD_EMAIL_OR_PASSWORD = new AuthLocalError('Bad email or password', 403, null, null);

/** Init */
const router = exa(express.Router());

const POLICIE_IS_AUTH = policies.isAuth(true);
const POLICIE_IS_NOT_AUTH = policies.isAuth(false);

// Session
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

router.$post('/session', POLICIE_IS_NOT_AUTH, async function (req, res, next) {
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

router.$delete('/session', POLICIE_IS_AUTH, async function (req, res, next) {
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

// Links
router.$get('/links', POLICIE_IS_AUTH, async function (req, res, next) {
  const links = await Link
    .find({
      creator: req.user.id
    })
    .populate('creator');

  let followings = [];
  if (links.length) {
    followings = await Following
      .mapReduce({
        /* eslint-disable no-undef */
        map: function () {
          emit(this.link, 1);
        },
        /* eslint-enable no-undef */
        reduce: function (k, vals) {
          return vals.length;
        }
      });
  }

  res
    .status(200)
    .send({
      status: 'success',
      data: _.map(links, (link) => {
        const followingsForThis = _.find(followings, { _id: link._id });

        const followingsCount = followingsForThis
                              ? followingsForThis.value
                              : 0;

        return {
          shortUrl:   link.shortUrl,
          fullUrl:    link.fullUrl,
          creator:    link.creator.email,
          created:    link.created,
          updated:    link.updated,
          followings: followingsCount
        };
      })
    });
});

router.$get(/^\/links\/(.+)/, POLICIE_IS_AUTH, async function (req, res, next) {
  const shortUrl = req.params[0];

  const link = await Link
    .findOne({
      shortUrl: shortUrl
    })
    .populate('creator');

  if (!link) {
    return next(ERROR_LINK_NOT_FOUND);
  }

  /** @todo  add checking for current user */

  const followings = await Following
    .find({
      link: link.id
    });

  res
    .status(200)
    .send({
      status: 'success',
      data: (() => {
        const sanitizedFollowings = _.map(followings, (following) => {
          return {
            ip:         following.ip,
            userAgent:  following.userAgent,
            created:    following.created,
            updated:    following.updated
          };
        });

        return {
          shortUrl:   link.shortUrl,
          fullUrl:    link.fullUrl,
          creator:    link.creator.email,
          created:    link.created,
          updated:    link.updated,
          followings: sanitizedFollowings
        };
      })()
    });
});

router.$post('/links', POLICIE_IS_AUTH, async function (req, res, next) {
  const { shortUrl, fullUrl } = req.body;

  const link = new Link({
    shortUrl: shortUrl,
    fullUrl:  fullUrl,
    creator:  req.user
  });

  await link.save().catch(ValidationError.asCatch({
    shortUrl: true,
    fullUrl:  true
  }));

  res
    .status(200)
    .send({
      status: 'success',
      data: {
        shortUrl:   link.shortUrl,
        fullUrl:    link.fullUrl,
        creator:    link.creator.email,
        created:    link.created,
        updated:    link.updated
      }
    });
});

router.$delete(/^\/links\/(.+)/, POLICIE_IS_AUTH, async function (req, res, next) {
  const shortUrl = req.params[0];

  const link = await Link.findOne({
    shortUrl: shortUrl
  });


  if (!link) {
    return next(ERROR_LINK_NOT_FOUND);
  }


  /** @todo  add checking for current user */


  await link.remove();

  res
    .status(200)
    .send({
      status: 'success',
      data: {
        deleted: true
      }
    });
});

export default router;
