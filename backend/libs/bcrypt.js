'use strict';
/** Requires */
import logger from './logger';

let bcrypt;

try {
  bcrypt = require('bcrypt');
} catch (err) {
  logger.warn('native bcrypt is not supported, trying js failback');
  bcrypt = require('bcryptjs');
}

module.exports = bcrypt;
