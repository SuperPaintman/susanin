'use strict';
/** Requires */
import _              from 'lodash';
import validator      from 'validator';

import mongoose       from 'mongoose';
import MongooseError  from 'mongoose/lib/error';

import bcrypt         from '../libs/bcrypt';

/** Constant */
export const SCHEMA_NAME = 'User';

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 64;

export const BCRYPT_ROUNDS = 10;

export const PASSWORD_HASH_TYPES = {
  'BCRYPT': {
    genSalt() {
      return new Promise((resolve, reject) => {
        bcrypt.genSalt(BCRYPT_ROUNDS, (err, salt) => {
          return err ? reject(err) : resolve(salt);
        });
      });
    },
    genSaltSync() {
      return bcrypt.genSaltSync(BCRYPT_ROUNDS);
    },

    passwordHash(password, salt) {
      return new Promise((resolve, reject) => {
        bcrypt.hash(password, salt, (err, encrypted) => {
          return err ? reject(err) : resolve(encrypted);
        });
      });
    },
    passwordHashSync(password, salt) {
      return bcrypt.hashSync(password, salt);
    }
  }
};

export const DEFAULT_PASSWOD_HASH_TYPE_NAME = 'BCRYPT';

export const ERROR_PATH_IS_REQUIRED     = '"{PATH}" is required';
export const ERROR_PATH_ALREADY_USED    = '"{PATH}" already used';
export const ERROR_PATH_MIN_LENGTH      = '"{PATH}" must be less than {MINLENGTH}';
export const ERROR_PATH_MAX_LENGTH      = '"{PATH}" must be greater than {MAXLENGTH}';
export const ERROR_PASSWORD_MIN_LENGTH  = `"{PATH}" must be less than ${PASSWORD_MIN_LENGTH}`;
export const ERROR_PASSWORD_MAX_LENGTH  = `"{PATH}" must be greater than ${PASSWORD_MAX_LENGTH}`;

const { Schema } = mongoose;

/** Init */
let UserModel;
const UserSchema = new Schema({
  /** Email */
  email: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    unique:     ERROR_PATH_ALREADY_USED,
    index:      true,
    validate: [{
      validator: (s) => validator.isEmail(s),
      msg: 'Invalid email'
    }],
    select:     true
  },
  _email: {
    type:       String,
    lowercase:  true,
    unique:     ERROR_PATH_ALREADY_USED,
    index:      true,
    select:     false
  },

  /** Password */
  _hashedPassword: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    select:     true
  },
  _salt: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    select:     true
  },
  _hashType: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    enum:       _.keys(PASSWORD_HASH_TYPES),
    default:    DEFAULT_PASSWOD_HASH_TYPE_NAME,
    select:     true
  },

  isActive: {
    type:       Boolean,
    required:   ERROR_PATH_IS_REQUIRED,
    default:    false,
    select:     true
  },

  /** Roles */
  role: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    lowercase:  true,
    enum: [
      'admin',
      'user'
    ],
    default:    'user',
    select:     true
  },

  /** Meta */
  registrationIP: {
    type:       String,
    required:   ERROR_PATH_IS_REQUIRED,
    index:      true,
    validate: [{
      validator: (s) => validator.isIP(s),
      msg: 'Invalid registration IP'
    }],
    default:    '::ffff:127.0.0.1',
    select:     false
  },

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

/** Virtal */
UserSchema.virtual('password')
  .get(function () {
    return this._password;
  })
  .set(function (password) {
    this._password = password;
  });

/** Pre validate */
// Password
UserSchema.pre('validate', function (next) {
  // Required
  if (!this.password && !this._hashedPassword) {
    this.invalidate('password', ERROR_PATH_IS_REQUIRED, this.password);
  }

  if (this.password && !_.isString(this.password)) {
    this.invalidate('password', new MongooseError.CastError('string', this.password, 'password'));
  }

  // Skip next checks
  if (!this.password) {
    return next();
  }

  // Length
  /**
   * @todo try replace `ERROR_PASSWORD_MIN_LENGTH` and 
   *       `ERROR_PASSWORD_MAX_LENGTH` with `ERROR_PATH_MIN_LENGTH` and
   *       `ERROR_PATH_MAX_LENGTH` constants, respectively.
   *       Now `{MINLENGTH}` and `{MAXLENGTH} template values not replaced.
   */
  const passLen = this.password.length;
  if (passLen < PASSWORD_MIN_LENGTH) {
    this.invalidate('password', ERROR_PASSWORD_MIN_LENGTH, this.password, 'minlength');
  } else if (passLen > PASSWORD_MAX_LENGTH) {
    this.invalidate('password', ERROR_PASSWORD_MAX_LENGTH, this.password, 'maxlength');
  }

  next();
});

// Email in lower case
UserSchema.pre('validate', function (next) {
  if (!this.isNew && !this.isModified('email')) {
    return next();
  }

  if (!this.email || !_.isString(this.email)) {
    return next();
  }

  this._email = this.email.toLowerCase();

  next();
});

// Email
UserSchema.pre('validate', function (next) {
  if (!this.isNew && !this.isModified('email')) {
    return next();
  }

  if (!this.email || !_.isString(this.email)) {
    return next();
  }

  UserModel
    .where({
      _email: this.email.toLowerCase()
    })
    .count()
    .then((count) => {
      if (count !== 0) {
        this.invalidate('email', ERROR_PATH_ALREADY_USED, this.email);
      }

      return next();
    })
    .catch((err) => next(err));
});


// Password Hash
UserSchema.pre('validate', function (next) {
  const self = this;

  if (!this.isNew && !this.password) {
    return next();
  }

  if (!this.password || !_.isString(this.password)) {
    return next();
  }

  return (async function () {
    // Set 
    self._hashType = DEFAULT_PASSWOD_HASH_TYPE_NAME;

    const salt = await self._genSalt();
    self._salt = salt;

    const encrypted = await self._passwordHash(self.password);
    self._hashedPassword = encrypted;

    next();
  })()
    .catch((err) => next(err));
});

/** Pre save */
// Set update date equal created date if document is new
UserSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next();
  }

  this.updated = this.created;

  next();
});

/** Pre save and update */
// Date of update
['save', 'update'].forEach((method) => {
  UserSchema.pre(method, function (next) {
    this.updated = Date.now();

    next();
  });
});

/** Pre find and findOne */
// Find email in lower case
['find', 'findOne'].forEach((method) => {
  UserSchema.pre(method, function (next) {
    if (!this._conditions.email || !_.isString(this._conditions.email)) {
      return next();
    }

    this._conditions._email = this._conditions.email.toLowerCase();
    delete this._conditions.email;

    next();
  });
});

/** Methods */
// Gen salt
UserSchema.methods._genSalt = function () {
  const hash = PASSWORD_HASH_TYPES[this._hashType];

  if (!hash) {
    return Promise.reject(new TypeError(`Unsupported hash type: "${this._hashType}"`));
  }

  return hash.genSalt();
};
UserSchema.methods._genSaltSync = function () {
  const hash = PASSWORD_HASH_TYPES[this._hashType];

  if (!hash) {
    throw new TypeError(`Unsupported hash type: "${this._hashType}"`);
  }

  return hash.genSaltSync();
};

// Password hashing
UserSchema.methods._passwordHash = function (password) {
  const hashType = PASSWORD_HASH_TYPES[this._hashType];

  if (!hashType) {
    return Promise.reject(new TypeError(`Unsupported hash type: "${this._hashType}"`));
  }

  return hashType.passwordHash(password, this._salt);
};
UserSchema.methods._passwordHashSync = function (password) {
  const hashType = PASSWORD_HASH_TYPES[this._hashType];

  if (!hashType) {
    throw new TypeError(`Unsupported hash type: "${this._hashType}"`);
  }

  return hashType.passwordHashSync(password, this._salt);
};

// Validate password
UserSchema.methods.isValidPassword = function (password) {
  return Promise.resolve()
    .then(() => this._passwordHash(password))
    .then((hashedPassword) => hashedPassword === this._hashedPassword);
};
UserSchema.methods.isValidPasswordSync = function (password) {
  return this._passwordHashSync(password) === this._hashedPassword;
};

UserModel = mongoose.model(SCHEMA_NAME, UserSchema);

export default UserModel;
