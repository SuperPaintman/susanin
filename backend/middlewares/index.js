'use strict';
/** Requires */
import bodyParser         from 'body-parser';
import cookieParser       from 'cookie-parser';

import passport           from 'passport';

import responseTime       from 'response-time';

import _                  from 'lodash';

import session            from './session';
import locals             from './locals';

/**
 * Middleware
 */
export default function middlewares(app) {
  app.use(responseTime());

  app.use(bodyParser.json({
    limit: '128mb'
  }));

  app.use(cookieParser());

  app.use(locals());
  app.use((req, res, next) => {
    res.locals = _.merge(res.locals, {
      /** @todo  add i18n */
      __: function (str) {
        return str;
      },

      _: _
    });

    next();
  });

  app.use(session({
    cookie: {
      secure: app.get('env is production') ? true : false
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use((req, res, next) => {
    // Logout if account is deactivated

    if (!req.isAuthenticated()) {
      return next();
    }

    if (!req.user.isActive) {
      req.logout();
    }

    next();
  });

  app.use((req, res, next) => {
    res.header('X-Powered-By', 'Susanin');

    next();
  });
}
