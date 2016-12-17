'use strict';
/** Requires */
// Main
const gulp          = require('gulp');
const $             = require('gulp-load-plugins')();

const jpegtran      = require('imagemin-jpegtran');
const pngquant      = require('imagemin-pngquant');
const gifsicle      = require('imagemin-gifsicle');

// Config
const config        = require('../config.js');
const helps         = require('../helps.js');

/** Constants */
const TASK_NAME = 'client:images';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Task */
gulp.task(TASK_NAME, () => {
  return gulp.src(config.paths.client.images.from)
    // Error handler
    .pipe($.plumber({
      errorHandler: helps.onError
    }))

    .pipe($.imagemin({
      progressive: true,
      use: [
        jpegtran(),
        pngquant(),
        gifsicle()
      ]
    }))

    .pipe(gulp.dest(config.paths.client.images.to))
    
    ;
});

/** Watch */
gulp.task(WATCH_TASK_NAME, () => {
  return gulp.watch(config.paths.client.styles.watch, [TASK_NAME]);
});
