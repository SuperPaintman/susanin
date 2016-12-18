'use strict';
/** Requires */
import _                from 'lodash';

import ExtendableError  from 'es6-error';

import {
  ValidationError as MongooseValidationError
}                       from 'mongoose/lib/error';

export class HttpError extends ExtendableError {
  constructor(message, status = 400) {
    super(message);

    this.type = 'RequestError';
    this.status = status;
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(message, 403);

    this.type = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(message, 404);

    this.type = 'NotFoundError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal server error') {
    super(message, 500);

    this.type = 'InternalServerError';
  }
}

export class AuthError extends HttpError {
  constructor(message, status = 400) {
    super(message, status);

    this.type = 'AuthError';
    this.status = status;
  }
}

export class AuthLocalError extends AuthError {
  constructor(message, status, email, password) {
    super(message, status);

    this.type = 'AuthError';
    this.email = email;

    Object.defineProperty(this, 'password', {
      value: password
    });
  }
}

export class AccountError extends HttpError {
  constructor(message, status = 403, user) {
    super(message, status);

    this.type = 'AccountError';

    Object.defineProperty(this, 'user', {
      value: user
    });
  }
}

export class SessionError extends HttpError {
  constructor(message, status = 403) {
    super(message, status);

    this.type = 'SessionError';
  }
}

export class ValidationError extends HttpError {
  constructor(message, status = 400, errors = {}, err = null) {
    super(message, status);

    this.type = 'ValidationError';

    this.errors = _.map(errors, (msg, param) => ({
      param:    param,
      message:  msg
    }));

    Object.defineProperty(this, 'mongooseError', {
      value: err
    });
  }

  static fromMongooseError(err, status = 400, paramsMap = {}) {
    const supportedErrors = _.pickBy((err.errors || {}), (val, key) => {
      return !!paramsMap[key];
    });

    const errors = _.reduce(supportedErrors, (res, val, key) => {
      const pathKey = (!paramsMap[key] || _.isBoolean(paramsMap[key]))
                    ? key
                    : paramsMap[key];

      if (err === err.errors[key]) {
        return res;
      }

      if (res[pathKey]) {
        return res;
      }

      res[pathKey] = ('' + err.errors[key]);

      return res;
    }, {});

    let message = '';
    if (_.size(errors)) {
      message = _.map(errors, (error) => error).join(', ');
    } else {
      message = 'Validation failed';
    }

    return new ValidationError(message, status, errors, err);
  }

  static asCatch(paramsMap, status) {
    return function (err) {
      if (!(err instanceof MongooseValidationError)) {
        return Promise.reject(err);
      }

      return Promise.reject(ValidationError.fromMongooseError(err, status, paramsMap));
    };
  }
}
