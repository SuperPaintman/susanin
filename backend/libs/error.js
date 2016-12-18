'use strict';
/** Requires */
import ExtendableError from 'es6-error';

export class HttpError extends ExtendableError {
  constructor(message, status = 400) {
    super(message);

    this.type = 'RequestError';
    this.status = status;
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

    this.email = email;

    Object.defineProperty(this, 'password', {
      value: password
    });
  }
}

export class AccountError extends HttpError {
  constructor(message, status = 403, user) {
    super(message, status);

    Object.defineProperty(this, 'user', {
      value: user
    });
  }
}
