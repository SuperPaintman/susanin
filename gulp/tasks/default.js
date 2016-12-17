'use strict';
/** Requires */
// Main
const gulp          = require('gulp');

/** Constants */
const TASK_NAME = 'default';

module.exports.TASK_NAME = TASK_NAME;

/** Task */
gulp.task(TASK_NAME, [
  require('./server.js.js').TASK_NAME,

  require('./client.js.js').TASK_NAME,
  require('./client.styles.js').TASK_NAME
]);
