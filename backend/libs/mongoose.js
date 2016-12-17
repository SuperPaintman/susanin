'use strict';
/** Requires */
import mongoose                   from 'mongoose';
import mongooseUniqueValidator    from 'mongoose-unique-validator';

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

/** Exports */
export default mongoose;
