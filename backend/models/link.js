'use strict';
/** Requires */
import uuid           from 'node-uuid';
import ulid           from 'ulid';
import validator      from 'validator';

import mongoose       from 'mongoose';

import User           from './user';

import fancyID        from '../libs/fancy-id-generator';

/** Constant */
export const SCHEMA_NAME = 'Link';

export const MAX_TRYING_TO_GENERATE_SHORT_URL = 10;

export const REGEXP_API_URL = /^\/?api(\/.*)?$/;

export const ERROR_PATH_IS_REQUIRED     = '`{PATH}` is required';
export const ERROR_PATH_ALREADY_USED    = '`{PATH}` already used';

export const ERROR_CANNOT_GENERATE_SHORT_URL = new Error('Cannot generate short url');

export const SHORT_URL_GENERATORS = {
  ['shortUuid']() {
    return Promise.resolve()
      .then(() => uuid.v4().split('-')[0]);
  },
  ['uuid']() {
    return Promise.resolve()
      .then(() => uuid.v4());
  },
  ['ulid']() {
    return Promise.resolve()
      .then(() => ulid());
  },
  ['fancy']() {
    return Promise.resolve()
      .then(() => fancyID('-'));
  },
  ['now']() {
    return Promise.resolve()
      .then(() => '' + Date.now());
  }
};

export const DEFAULT_SHORT_URL_GENERATOR_NAME = 'shortUuid';

const { Schema } = mongoose;

/** Init */
let LinkModel;
const LinkSchema = new Schema({
  /** Full URL */
  fullUrl: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    validate: [{
      validator: (s) => validator.isURL(s),
      msg: 'Invalid full url'
    }],
    select:     true
  },

  /** Short URL */
  shortUrl: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    unique:     ERROR_PATH_ALREADY_USED,
    validate: [{
      validator: (s) => s.charAt(0) !== '_',
      msg: 'Short URL cannot start with "_"'
    }, {
      validator: (s) => s.charAt(0) !== '/',
      msg: 'Short URL cannot start with "/"'
    }, {
      validator: (s) => s.charAt(s.length - 1) !== '/',
      msg: 'Short URL cannot end with "/"'
    }, {
      validator: (s) => s.replace(/\/+/, '/') === s,
      msg: 'Short URL cannot contain multiple "/" in a row'
    }, {
      validator: (s) => {
        const withoutSlash = s.split('/').join('');

        const encoded = encodeURIComponent(withoutSlash);

        return withoutSlash === encoded;
      },
      msg: 'Short URL should not contain special characters except "/"'
    }, {
      validator: (s) => !REGEXP_API_URL.test(s),
      msg: 'Short URL cannot start with "api" or "api/*"'
    }],
    select:     true
  },

  /** Creator */
  creator: {
    type:       Schema.Types.ObjectId,
    ref:        User.modelName,
    required:   ERROR_PATH_IS_REQUIRED,
    index:      true,
    select:     true
  }
}, {
  createdAndUpdated: true
});

/** Pre validate */
// Default short URL
LinkSchema.pre('validate', function (next) {
  if (!this.isNew) {
    return next();
  }

  if (this.shortUrl) {
    return next();
  }

  return LinkModel.genShortUrl(DEFAULT_SHORT_URL_GENERATOR_NAME)
    .then((shortUrl) => {
      this.shortUrl = shortUrl;

      next();
    })
    .catch((err) => {
      if (err.message !== ERROR_CANNOT_GENERATE_SHORT_URL.message) {
        return next(err);
      }

      this.invalidate('shortUrl', err.message);

      next();
    });
});

/** Statucs */
LinkSchema.statics.genShortUrl = async function (generatorName = DEFAULT_SHORT_URL_GENERATOR_NAME) {
  const generator = SHORT_URL_GENERATORS[generatorName];

  if (!generator) {
    throw new TypeError(`Unsupported short url generator: "${generatorName}"`);
  }

  let shortUrl = '';

  let i = 0;

  while (true) {
    shortUrl = await generator();

    const isAlreadyUsed = !!await LinkModel
      .where({
        shortUrl: shortUrl
      })
      .count();

    if (!isAlreadyUsed) {
      break;
    }

    i++;

    if (i > MAX_TRYING_TO_GENERATE_SHORT_URL) {
      throw ERROR_CANNOT_GENERATE_SHORT_URL;
    }
  }

  return shortUrl;
};

LinkModel = mongoose.model(SCHEMA_NAME, LinkSchema);

export default LinkModel;
