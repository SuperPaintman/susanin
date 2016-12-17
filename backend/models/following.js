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
    ref:        Link,
    required:   ERROR_PATH_IS_REQUIRED,
    index:      true,
    select:     true
  },

  /** Referer */
  referer: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
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
  },

  /** Meta */
  created: {
    type:       Date,
    default:    Date.now,
    select:     true
  },
  updated: {
    type:       Date,
    default:    Date.now,
    select:     true
  }
});

/** Pre save */
// Set update date equal created date if document is new
FollowingSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next();
  }

  this.updated = this.created;

  next();
});

/** Pre save and update */
// Date of update
['save', 'update'].forEach((method) => {
  FollowingSchema.pre(method, function (next) {
    this.updated = Date.now();

    next();
  });
});

FollowingModel = mongoose.model(SCHEMA_NAME, FollowingSchema);

export default FollowingModel;
