'use strict';
/** Requires */
// Main
const path                    = require('path');
const fs                      = require('fs');

const gulp                    = require('gulp');
const $                       = require('gulp-load-plugins')();

const through                 = require('through2');
const webpack                 = require('webpack');
const webpackStream           = require('webpack-stream');
const ManifestPlugin          = require('webpack-manifest-plugin');

const _                       = require('lodash');

// Config
const config                  = require('../config.js');
const helps                   = require('../helps.js');

/** Constants */
const TASK_NAME = 'client:js';
const WATCH_TASK_NAME = `watch:${TASK_NAME}`;

module.exports.TASK_NAME = TASK_NAME;
module.exports.WATCH_TASK_NAME = WATCH_TASK_NAME;

/** Help */
function webpackTask(options) {
  if (options === undefined) {
    options = {};
  }

  return gulp.src(config.paths.client.js.from)
    // Error handler
    .pipe($.plumber({
      errorHandler: helps.onError
    }))

    // Webpack
    .pipe(webpackStream(_.merge({
      entry: {
        all: config.paths.client.js.from
      },
      output: {
        publicPath:     `${config.isProduction ? config.staticAddr : ''}/${config.folders.client.public}/js/`,
        filename:       config.isProduction ? '[name]-[hash].js' : '[name].js',
        chunkFilename:  config.isProduction ? 'chunk.[name]-[hash]-[chunkhash].js' : 'chunk.[name].js'
      },
      module: {
        loaders: [{
          test: /\.js$/,
          exclude: /(node_modules)/,
          loaders: [
            'ng-annotate',
            `babel?${JSON.stringify({
              presets: ['es2015', 'stage-3'],
              plugins: 'lodash'
            })}`
          ]
        }]
      },
      devtool: !config.isProduction ? 'source-map' : null,
      plugins: (function () {
        const plugins = [];

        if (config.isProduction) {
          // plugins.push(new webpack.SourceMapDevToolPlugin());
        }

        if (config.isProduction) {
          plugins.push(new ManifestPlugin({
            fileName: config.paths.manifest.filenames.js
          }));
        }

        if (config.isProduction) {
          plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: false
            },
            output: {
              comments: false
            }
          }));
        }

        plugins.push(new webpack.DefinePlugin({
          IS_PRODUCTION:  JSON.stringify(config.isProduction),
          STATIC_ADDR:    JSON.stringify(config.staticAddr)
        }));

        return plugins;
      })()
    }, options)))

    // Сохранение
    .pipe(gulp.dest(config.paths.client.js.to))

    // Перемещение Manifest
    .pipe(through.obj(function (chunk, enc, cb) {
      const manifestName = path.parse(config.paths.manifest.filenames.js).base;
      const filename = path.parse(chunk.path).base;

      if (manifestName !== filename) {
        return cb(null, chunk);
      }

      const originPath = chunk.path;

      chunk.path = path.join(
        config.paths.manifest.path,
        config.paths.manifest.filenames.js
      );
      chunk.base = config.paths.manifest.path;

      fs.rename(originPath, chunk.path, (err) => {
        cb(err, chunk);
      });
    }))
    ;
}

/** Task */
gulp.task(TASK_NAME, () => {
  return webpackTask();
});

/** Watch */
gulp.task(WATCH_TASK_NAME, () => {
  return webpackTask({
    watch: true
  });
});
