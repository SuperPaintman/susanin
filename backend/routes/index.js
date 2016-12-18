'use strict';
/** Requires */
import url                from 'url';

import {
  ValidationError
}                         from 'mongoose/lib/error';

import templatesRouters   from './templates';
import apiV1Routes        from './api/v1';

import logger             from '../libs/logger';
import {
  AuthLocalError,
  AccountError,
  NotFoundError,
  InternalServerError
}                         from '../libs/error';

import Link               from '../models/link';
import Following          from '../models/following';

/** Constants */
export const ERROR_NOT_FOUND = new NotFoundError('Not Found');
export const ERROR_INTERNAL_SERVER = new InternalServerError('Internal server error');

/** Routes */
export default function routes(app) {
  app.use('/templates', templatesRouters);

  app.$get('/', async function (req, res) {
    res
      .status(302)
      .redirect('/_/');
  });

  app.$get(/^\/_(?:\/.*)?$/, async function (req, res) {
    res.render('index.jade');
  });

  /** api */
  app.use('/api/v1', apiV1Routes);

  app.$get('*', async function (req, res, next) {
    const pathname = (req._parsedUrl && req._parsedUrl.pathname)
      ? req._parsedUrl.pathname
      : url.parse(req.url).pathname;

    let shortUrl = pathname.substring(1);
    const shortUrlLen = shortUrl.length;
    if (shortUrl.charAt(shortUrlLen - 1) === '/') {
      shortUrl = shortUrl.substring(0, shortUrlLen - 1);
    }


    const link = await Link.findOne({
      shortUrl: shortUrl
    });


    if (!link) {
      return next(ERROR_NOT_FOUND);
    }


    process.nextTick(() => {
      logger.info(`${req.ip} redirect to (${link.shortUrl}) "${link.fullUrl}" from "${req.headers['referer'] || 'direct'}"`);
    });


    // Async
    process.nextTick(() => {
      new Following({
        link:       link,
        referer:    req.headers['referer'],
        ip:         req.ip,
        userAgent:  req.headers['user-agent']
      })
        .save()
        .catch((err) => logger.error('Cannot save following:', err));
    });


    res
      .status(302)
      .redirect(link.fullUrl);
  });

  // 404
  app.$use(async function (req, res, next) {
    return next(ERROR_NOT_FOUND);
  });

  // Error handler and 500
  app.$use(async function (err, req, res, next) {
    let error = err;
    if (!(err instanceof AuthLocalError
        || err instanceof AccountError
        || err instanceof NotFoundError
        || err instanceof ValidationError)) {
      logger.debug('Untracked API error:', err);

      logger.fatal(err);

      error = ERROR_INTERNAL_SERVER;
    }

    let errorStatus;
    let errorMessage;
    let errorType;
    let errors;
    if (err instanceof ValidationError) {
      errorStatus   = 400;
      errorMessage  = Object.keys(err.errors || {})
        .filter((key) => key.charAt(0) !== '_')
        .map((key) => {
          if (err === err.errors[key]) {
            return;
          }

          return ('' + err.errors[key]);
        })
        .join(', ');
      errorType     = 'ValidationError';
      errors = Object.keys(err.errors || {})
        .filter((key) => key.charAt(0) !== '_')
        .map((key) => {
          if (err === err.errors[key]) {
            return;
          }

          const e = err.errors[key];

          return {
            param:   e.path,
            message: ('' + e)
          };
        });
    } else {
      errorStatus   = error.status || 400;
      errorMessage  = error.message;
      errorType     = error.type;
    }

    return res.format({
      json() {
        logger.debug('Format HTTP error as json');

        return res
          .status(errorStatus)
          .send({
            status: 'error',
            error: {
              type:     errorType,
              message:  errorMessage,
              errors:   errors
            }
          });
      },

      html() {
        logger.debug('Format HTTP error as html');

        res
          .status(errorStatus)
          .render('error.jade', {
            error: {
              code:     errorStatus,
              message:  errorMessage,
              errors:   errors
            }
          });
      },

      default() {
        logger.debug('Format HTTP error as plain');

        res
          .status(errorStatus)
          .send(errorMessage);
      }
    });
  });
}
