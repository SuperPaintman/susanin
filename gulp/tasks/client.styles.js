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
const TASK_NAME = 'client:styles';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Task */
gulp.task(TASK_NAME, () => {
  return gulp.src(config.paths.client.styles.from)
    // Error handler
    .pipe($.plumber({
      errorHandler: helps.onError
    }))

    // Source map
    .pipe($.if(!config.isProduction, $.sourcemaps.init()))

    // Render Styles
    .pipe($.stylus({
      define: {
        $IS_PRODUCTION: config.isProduction,
        $STATIC_ADDR:   config.staticAddr,
        $GULP_TMP_DIR:  path.join(__dirname, '../..', config.paths.client.icons.tmp)
      }
    }))

    // Добавление префиксов
    .pipe($.autoprefixer({
      browsers: ['last 100 version']
    }))

    // Минификация для SourceMap
    /** @todo  добавить keepSpecialComments */
    .pipe($.if(!config.isProduction, $.cleanCss({
      rebase: false
    })))

    // Конкатинация
    .pipe($.concat('all.css', {
      newLine: ''
    }))

    // Повторная очистка от ;
    .pipe($.cleanCss({
      rebase: false
    }))

    // Rev
    .pipe($.if(config.isProduction, $.rev()))

    // End Source map
    .pipe($.if(!config.isProduction, $.sourcemaps.write('./')))

    // Сохранение
    .pipe(gulp.dest(config.paths.client.styles.to))

    // Rev manifest
    .pipe($.if(config.isProduction, $.rev.manifest({
      path: config.paths.manifest.filenames.css,
      merge: true
    })))
    .pipe($.if(config.isProduction, gulp.dest(config.paths.manifest.path)))
    
    ;
});

/** Watch */
gulp.task(WATCH_TASK_NAME, () => {
  return gulp.watch(config.paths.client.styles.watch, [TASK_NAME]);
});
