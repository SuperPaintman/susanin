'use strict';
/** Requires */
import path       from 'path';

import glob       from 'glob';

const models = glob.sync(path.join(__dirname, './*.js'), {
  ignore: [
    __filename,
    path.join(__dirname, './_*.js'),
    path.join(__dirname, './.*.js')
  ]
})
  .map((moduleName) => require(moduleName).default)
  .reduce((res, mod) => {
    res[mod.modelName] = mod;

    return res;
  }, {});

module.exports = models;
