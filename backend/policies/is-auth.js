'use strict';
/** Requires */
import {
  SessionError
}                         from '../libs/error';

/** Constants */
export const ERROR_IS_AUTH      = new SessionError('You are authorized', 403);
export const ERROR_IS_NOT_AUTH  = new SessionError('You are not authorized', 403);

export default function isAuth(isLogin = true) {
  return function (req, res, next) {
    if (req.isAuthenticated() === isLogin) {
      next();
    } else {
      next(!isLogin ? ERROR_IS_AUTH : ERROR_IS_NOT_AUTH);
    }
  };
}
