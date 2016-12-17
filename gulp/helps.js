'use strict';
/** Requires */
const $ = require('gulp-load-plugins')();

module.exports.onError = function onError(err) {
  $.util.log($.util.colors.red('Error'), err.toString());

  this.end();
};
