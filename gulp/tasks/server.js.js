'use strict';
/** Requires */
const path          = require('path');

// Main
const gulp          = require('gulp');
const $             = require('gulp-load-plugins')();

// Config
const config        = require('../config.js');
const helps         = require('../helps.js');

/** Constants */
const TASK_NAME = 'server:js';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Task */
gulp.task(TASK_NAME, () => {
  return gulp.src(config.paths.server.js.from)
    // Error handler
    .pipe($.plumber({
      errorHandler: helps.onError
    }))

    // Catch
    .pipe($.cached(TASK_NAME))

    // Source map
    .pipe($.sourcemaps.init())

    // Babel render
    .pipe($.babel(config.babel.server))

    //End source map
    .pipe($.sourcemaps.write())

    // Сохранение
    .pipe(gulp.dest(config.paths.server.js.to))

    ;
});

/** Watch */
gulp.task(WATCH_TASK_NAME, () => {
  return gulp.watch(config.paths.server.js.watch, [TASK_NAME])
    .on('unlink', (filepath) => {
      const resolvedFilepath = path.resolve(filepath);

      if ($.cached.caches[TASK_NAME]) {
        delete $.cached.caches[TASK_NAME][resolvedFilepath];
      }
    });
});
