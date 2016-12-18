'use strict';
/** Requires */
import expressSession  from 'express-session';

// Utils
import _               from 'lodash';
import logger          from '../libs/logger';
import config          from '../libs/config';


export default function (options) {
  const storeType = config.get('sessionStore.store');

  let host = '';
  let port = '';
  let base = '';
  let user = '';
  let pass = '';

  let store;
  switch (storeType.toLowerCase()) {
    // MongoDB
    case 'mongo':
    case 'mongodb':
      if (config.has('sessionStore.host') && config.get('sessionStore.host')) {
        host  = config.get('sessionStore.host');
        port  = config.get('sessionStore.port');
        base  = config.get('sessionStore.base');
        user  = config.has('sessionStore.user')
              ? config.get('sessionStore.user')
              : null;
        pass  = config.has('sessionStore.pass')
              ? config.get('sessionStore.pass')
              : null;
      } else {
        logger.warn('"sessionStore" is not set in config, using "db" for session store');

        host  = config.get('db.host');
        port  = config.get('db.port');
        base  = config.get('db.base');
        user  = config.get('db.user');
        pass  = config.get('db.pass');
      }

      const MongoStore = require('connect-mongo')(expressSession);

      let auth = '';
      if (user) {
        auth += encodeURIComponent(user);
      }

      if (user && pass) {
        auth += ':' + encodeURIComponent(pass);
      }

      if (user || pass) {
        auth += '@';
      }

      const url = `mongodb://${auth}${
        encodeURIComponent(host)
      }:${
        encodeURIComponent(port)
      }/${
        encodeURIComponent(base)
      }`;

      store = new MongoStore({
        url: url
      });
      break;
    // Redis
    case 'redis':
      host  = config.get('sessionStore.host');
      port  = config.get('sessionStore.port');
      base  = config.get('sessionStore.base');
      user  = config.get('sessionStore.user');
      pass  = config.get('sessionStore.pass');

      const RedisStore = require('connect-redis')(expressSession);
      store = new RedisStore({
        host: host,
        port: port,
        db:   base,
        pass: pass
      });
      break;
    default:
      throw new Error(`Unsupported session store: "${storeType}"`);
  }

  options = _.merge({
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false
    },
    secret: config.get('server.session.secret'),
    store:  store
  }, options);

  const middleware = expressSession(options);

  return function session(req, res, next) {
    return middleware.call(this, req, res, next);
  };
}
