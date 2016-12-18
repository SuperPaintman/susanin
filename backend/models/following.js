'use strict';
/** Requires */
import validator      from 'validator';

import mongoose       from 'mongoose';

import Link           from './link';

/** Constant */
export const SCHEMA_NAME = 'Following';

export const ERROR_PATH_IS_REQUIRED     = '"{PATH}" is required';
export const ERROR_PATH_ALREADY_USED    = '"{PATH}" already used';

const { Schema } = mongoose;

/** Init */
let FollowingModel;
const FollowingSchema = new Schema({
  /** Link */
  link: {
    type:       Schema.Types.ObjectId,
    ref:        Link.modelName,
    required:   ERROR_PATH_IS_REQUIRED,
    index:      true,
    select:     true
  },

  /** Referer */
  referer: {
    type:       String,
    validate: [{
      validator: (s) => validator.isURL(s),
      msg: 'Invalid referer url'
    }],
    select:     true
  },

  /** IP */
  ip: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    index:      true,
    validate: [{
      validator: (s) => validator.isIP(s),
      msg: 'Invalid following IP'
    }],
    select:     true
  },

  /** UserAgent */
  userAgent: {
    type:       String,
    select:     true
  }
}, {
  createdAndUpdated: true
});

FollowingModel = mongoose.model(SCHEMA_NAME, FollowingSchema);

export default FollowingModel;
