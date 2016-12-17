'use strict';
/** Requires */
// Main
const gulp          = require('gulp');

/** Constants */
const TASK_NAME = 'watch';

module.exports.TASK_NAME = TASK_NAME;

/** Task */
gulp.task(TASK_NAME, [
  require('./server.js.js').WATCH_TASK_NAME,

  require('./client.js.js').WATCH_TASK_NAME,
  require('./client.styles.js').WATCH_TASK_NAME
]);
