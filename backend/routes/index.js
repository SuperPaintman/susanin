'use strict';
/** Requires */
import url                from 'url';

import templatesRouters   from './templates';

import logger             from '../libs/logger';

import Link               from '../models/link';
import Following          from '../models/following';

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
      return next();
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

  app.$use(async function (req, res, next) {
    const errorStatus   = 404;
    const errorMessage  = 'Not Found';
    const errorType     = 'NotFoundError';

    res.format({
      json() {
        logger.debug('Format 404 response as json');

        res
          .status(errorStatus)
          .send({
            status: 'error',
            error: {
              type:     errorType,
              message:  errorMessage
            }
          });
      },

      html() {
        logger.debug('Format 404 response as html');

        res
          .status(errorStatus)
          .render('error.jade', {
            error: {
              code:     errorStatus,
              message:  errorMessage
            }
          });
      },

      default() {
        logger.debug('Format 404 response as plain');

        res
          .status(errorStatus)
          .send(errorMessage);
      }
    });
  });

  app.$use(async function (err, req, res, next) {
    logger.fatal(err);

    const errorStatus   = 500;
    const errorMessage  = 'Internal server error';
    const errorType     = 'InternalServerError';

    res.format({
      json() {
        logger.debug('Format 500 response as json');

        res
          .status(errorStatus)
          .send({
            status: 'error',
            error: {
              type:     errorType,
              message:  errorMessage
            }
          });
      },

      html() {
        logger.debug('Format 500 response as html');

        res
          .status(errorStatus)
          .render('error.jade', {
            error: {
              code:     errorStatus,
              message:  errorMessage
            }
          });
      },

      default() {
        logger.debug('Format 500 response as plain');

        res
          .status(errorStatus)
          .send(errorMessage);
      }
    });
  });
}
