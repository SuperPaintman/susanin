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

// `created` and `updated` fields
mongoose.plugin((schema, opts) => {
  if (!schema.options.createdAndUpdated) {
    return;
  }

  schema.add({
    created: {
      type:       Date,
      default:    Date.now,
      select:     true
    }
  });

  schema.add({
    updated: {
      type:       Date,
      default:    Date.now,
      select:     true
    }
  });

  /** Pre save */
  // Set update date equal created date if document is new
  schema.pre('save', function (next) {
    if (!this.isNew) {
      return next();
    }

    this.updated = this.created;

    next();
  });

  /** Pre save and update */
  // Date of update
  ['save', 'update'].forEach((method) => {
    schema.pre(method, function (next) {
      if (this.isNew) {
        return next();
      }

      this.updated = Date.now();

      next();
    });
  });
});

/** Exports */
export default mongoose;
