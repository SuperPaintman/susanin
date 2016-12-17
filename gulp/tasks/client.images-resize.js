'use strict';
/** Requires */
const path          = require('path');

// Main
const gulp          = require('gulp');
const $             = require('gulp-load-plugins')();

const jpegtran      = require('imagemin-jpegtran');
const pngquant      = require('imagemin-pngquant');
const gifsicle      = require('imagemin-gifsicle');

const glob          = require('glob');
const _             = require('lodash');

// Config
const config        = require('../config.js');
const helps         = require('../helps.js');

/** Constants */
const TASK_NAME = 'client:images-resize';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Task */
gulp.task(TASK_NAME, () => {
  if (!(config.imageResize && config.imageResize.images)) {
    return Promise.resolve();
  }

  /** Проверка, используются ли глобы */
  config.imageResize.images = _.reduce(config.imageResize.images, (res, image) => {
    if (glob.hasMagic(image.path)) {
      const files = glob.sync(path.join(
        __dirname,
        `../../${config.folders.client.source}/${config.folders.client.assets.images}/`,
        image.path
      ))
        .map((file) => {
          return path.relative(
            path.join(__dirname, `../../${config.folders.client.source}/${config.folders.client.assets.images}/`),
            file
          );
        });

      res = res.concat(files.map((file) => {
        const pathInfo = path.parse(file);

        const sizes = _.cloneDeep(image.sizes).map((size, i) => {
          /**
           * FILE_NAME
           * FILE_BASE
           * FILE_EXT
           * SIZE_W
           * SIZE_H
           * I
           */
          
          size.path = size.path
            .replace(/{{(.+)}}/, (str, expression) => {
              /*eslint-disable no-unused-vars */
              const FILE_NAME   = pathInfo.name;
              const FILE_BASE   = pathInfo.base;
              const FILE_EXT    = pathInfo.ext;
              const SIZE_W      = size.w;
              const SIZE_H      = size.h;
              const I           = i;
              /*eslint-enable no-unused-vars */

              return eval(`(function () { return (${expression}); })();`);
            })
            .replace('{FILE_NAME}', pathInfo.name)
            .replace('{FILE_BASE}', pathInfo.base)
            .replace('{FILE_EXT}', pathInfo.ext)
            .replace('{SIZE_W}', size.w)
            .replace('{SIZE_H}', size.h)
            .replace('{I}', i);

          return size;
        });

        return {
          path:   file,
          crop:   image.crop    ? true : false,
          retina: image.retina  ? true : false,
          sizes:  sizes
        };
      }));
    } else {
      res = res.concat([image]);
    }

    return res;
  }, []);

  _.forEach(config.imageResize.images, (image) => {
    let retinaSizes;

    /** Проверка, есть ли ретина размеры */
    if (image.retina) {
      retinaSizes = _.cloneDeep(image.sizes);

      retinaSizes = _.map(retinaSizes, (size) => {
        if (size.w) {
          size.w *= 2;
        }

        if (size.h) {
          size.h *= 2;
        }

        const pathInfo = path.parse(size.path);
        pathInfo.name = `${pathInfo.name}--x2`;
        pathInfo.base = `${pathInfo.name}${pathInfo.ext}`;

        size.path = path.format(pathInfo);
        
        return size;
      });

      image.sizes = image.sizes.concat(retinaSizes);
    }

    return Promise.all(
      _.map(image.sizes, (size) => {
        const pathInfo = path.parse(size.path);

        // const fileFormat = pathInfo.ext.slice(1);

        const resizeSets = _.merge({
          width:          0,
          height:         0,
          crop:           false,
          upscale:        false,
          imageMagick:    true
        }, {
          width:          size.w,
          height:         size.h,
          crop:           image.crop,
          upscale:        image.upscale
        });

        return gulp.src(path.join(
          __dirname,
          `../../${config.folders.client.source}/${config.folders.client.assets.images}/`,
          image.path
        ))
          // Error handler
          .pipe($.plumber({
            errorHandler: helps.onError
          }))

          // Resize
          .pipe($.imageResize(resizeSets))

          .pipe($.imagemin({
            progressive: true,
            use: [
              jpegtran(),
              pngquant(),
              gifsicle()
            ]
          }))

          // Rename
          .pipe($.rename(pathInfo.base))

          .pipe(gulp.dest(path.join(
            __dirname,
            `../../${config.folders.client.public}/images/`,
            pathInfo.dir
          )))

          ;
      })
    );
  });
});

/** Watch */
gulp.task(WATCH_TASK_NAME, () => {
  return gulp.watch(config.paths.client.styles.watch, [TASK_NAME]);
});
