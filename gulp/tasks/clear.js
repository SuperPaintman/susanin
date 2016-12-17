'use strict';
/** Requires */
const path          = require('path');

// Main
const gulp          = require('gulp');
const del           = require('del');

// Config
const config        = require('../config.js');

/** Constants */
const TASK_NAME = 'clear';

module.exports.TASK_NAME = TASK_NAME;

/** Task */
gulp.task(TASK_NAME, () => {
  return Promise.all([
    del(`${config.folders.client.public}/**`),
    del(`${config.folders.server.build}/**`),
    del(`${config.folders.tmp}/**`),
    del(path.join(config.paths.manifest.path, config.paths.manifest.filenames.js)),
    del(path.join(config.paths.manifest.path, config.paths.manifest.filenames.css))
  ]);
});
