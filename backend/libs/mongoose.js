'use strict';
/** Requires */
import mongoose                   from 'mongoose';
import mongooseUniqueValidator    from 'mongoose-unique-validator';

import _                          from 'lodash';

import config                     from './config';
import logger                     from './logger';

/** Init */
mongoose.Promise = global.Promise;

/*eslint-disable camelcase */
const options = {
  db: {
    native_parser: true
  },
  user: config.get('db.user'),
  pass: config.get('db.pass'),
  config: {
    autoIndex: true
  }
};
/*eslint-enable camelcase */

mongoose.connect(`mongodb://${
  encodeURIComponent(config.get('db.host'))
}:${
  encodeURIComponent(config.get('db.port'))
}/${
  encodeURIComponent(config.get('db.base'))
}`, options, (err) => {
  if (err) {
    logger.fatal(err);

    process.exit(1);
  }
});

mongoose.plugin(mongooseUniqueValidator);

// Removing "_*" fields from Object and JSON
mongoose.plugin((schema, opts) => {
  ['toObject', 'toJSON'].forEach((method) => {
    if (!schema.options[method]) {
      schema.options[method] = {};
    }

    schema.options[method].transform = function transform(doc, ret, opt) {
      _(ret)
        .keys()
        .filter((key) => key.charAt(0) === '_')
        .forEach((key) => {
          delete ret[key];
        });

      return ret;
    };
  });
});

/** Exports */
export default mongoose;
