'use strict';
/** Requires */
const path          = require('path');

const requireDir    = require('require-dir');

/** Tasks */
requireDir(path.join(__dirname, './gulp/tasks/'), {
  recurse: true
});
