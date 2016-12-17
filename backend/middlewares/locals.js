'use strict';
/** Requires */
import fs         from 'fs';
import path       from 'path';
import url        from 'url';

// Utils
import glob       from 'glob';
import _          from 'lodash';

import config     from '../libs/config';

/**
 * Normolizing all URL to site root
 * @param  {String[]} paths
 * 
 * @return {String[]}
 */
function normalizePaths(paths) {
  return paths
    .map((pathTo) => path.relative(path.join(__dirname, '../..'), pathTo))
    .map((pathTo) => pathTo.split(path.sep).join('/'))
    .map((pathTo) => url.resolve('/', pathTo));
}

/** Init */
const environment   = config.get('environment');

const isProduction = environment === 'production';

const staticAddr  = config.get('staticAddr')
                  ? config.get('staticAddr')
                  : '';

export default function () {
  let staticAddrPrefix = '';

  let styles = [];
  let scripts = [];
  if (isProduction && staticAddr !== '') {
    staticAddrPrefix = staticAddr;

    const manifestCss = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../manifest-css.json')).toString()
    );
    const manifestJs = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../manifest-js.json')).toString()
    );

    _.forEach(manifestCss, (compiled, origin) => {
      if (!(/\.css$/i).test(compiled)) {
        return;
      }

      styles.push(url.resolve('/public/css/', compiled));
    });

    _.forEach(manifestJs, (compiled, origin) => {
      if (!(/\.js$/i).test(compiled)) {
        return;
      }

      scripts.push(url.resolve('/public/js/', compiled));
    });
  } else {
    styles = glob.sync(
      path.resolve(__dirname, '../../public/css/**/*.css'), {
        ignore: [
          path.resolve(__dirname, '../../public/css/**/_*.css'),
          path.resolve(__dirname, '../../public/css/**/.*.css')
        ]
      });
    scripts = glob.sync(
      path.resolve(__dirname, '../../public/js/**/*.js'), {
        ignore: [
          path.resolve(__dirname, '../../public/js/**/_*.js'),
          path.resolve(__dirname, '../../public/js/**/.*.js')
        ]
      });
  }

  styles  = normalizePaths(styles);
  scripts = normalizePaths(scripts);

  styles  = styles.map((item) => {
    return {
      src: url.resolve(staticAddrPrefix, item)
    };
  });
  scripts = scripts.map((item) => {
    return {
      src: url.resolve(staticAddrPrefix, item)
    };
  });
  
  return function locals(req, res, next) {
    res.locals = _.merge(res.locals, {
      pretty:         true,
      debugComments:  false,

      page: {
        lang: 'en',
        title: 'Susanin',

        styles:  styles,
        scripts: [
          ...scripts
        ],

        angular: 'App',

        seo: {
          robots: {
            index: false,
            follow: false
          }
        }
      }
    });

    next();
  };
}
