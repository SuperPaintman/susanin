'use strict';
/** Requires */
// Main
const gulp          = require('gulp');

/** Constants */
const TASK_NAME = 'lint';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Task */
gulp.task(TASK_NAME, [
  require('./lint.js.js').TASK_NAME,
  require('./lint.styles.js').TASK_NAME,
  require('./lint.templates.js').TASK_NAME
]);

/** Watch */
gulp.task(WATCH_TASK_NAME, [
  require('./lint.js.js').WATCH_TASK_NAME,
  require('./lint.styles.js').WATCH_TASK_NAME,
  require('./lint.templates.js').WATCH_TASK_NAME
]);
