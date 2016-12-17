'use strict';
/** Requires */
const path          = require('path');

// Main
const gulp          = require('gulp');
const $             = require('gulp-load-plugins')();

const svgo          = require('imagemin-svgo');

// Config
const config        = require('../config.js');
const helps         = require('../helps.js');

/** Constants */
const TASK_NAME = 'client:icons';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

/**
 * @todo  заменить timestamp на хеш контента файла
 */
const FONST_NAME = `icons${
  config.isProduction ? '-' + Date.now()  : ''
}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Task */
gulp.task(TASK_NAME, () => {
  return gulp.src(config.paths.client.icons.from)
    // Error handler
    .pipe($.plumber({
      errorHandler: helps.onError
    }))

    .pipe($.imagemin({
      use: [
        svgo({
          multipass: true
        })
      ]
    }))

    .pipe($.cssIconfont({
      fontName: FONST_NAME,
      path: 'styl',
      targetPath: path.relative(__dirname, path.join(
        __dirname,
        '../..',
        config.paths.client.icons.tmp,
        '/icons.styl'
      )),
      fontPath: `/${config.folders.client.public}/${config.folders.client.assets.icons}/`,
      cssSelector: '$icon',
      separator: '-'
    }))

    .pipe($.iconfont({
      fontName: FONST_NAME,
      prependUnicode: true,
      formats: [
        'ttf',
        'eot',
        'woff',
        'woff2',
        'svg'
      ],
      timestamp: Math.round(Date.now() / 1000),
      normalize: true
    }))

    .pipe(gulp.dest(config.paths.client.icons.to))

    ;
});

/** Watch */
gulp.task(WATCH_TASK_NAME, () => {
  return gulp.watch(config.paths.client.icons.watch, [TASK_NAME]);
});
