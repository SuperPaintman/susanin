'use strict';
/** Requires */
const fs            = require('fs');
const path          = require('path');

// Utils
const yaml          = require('js-yaml');

/** Constants */
const isProduction  = process.env.NODE_ENV === 'production';
const staticAddr    = process.env.NODE_STATIC_ADDR
                    ? ('' + process.env.NODE_STATIC_ADDR)
                    : '';

const babelServerConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../server.babelrc')).toString()
);

const eslintConfig = yaml.load(
  fs.readFileSync(path.join(__dirname, '../.eslintrc.yml')).toString()
);

const stylintConfig = yaml.load(
  fs.readFileSync(path.join(__dirname, '../.stylintrc.yml')).toString()
);

const puglintConfig = yaml.load(
  fs.readFileSync(path.join(__dirname, '../.pug-lintrc.yml')).toString()
);

const imageResizeConfig =  yaml.load(
  fs.readFileSync(path.join(__dirname, '../gulp-image-resize.yml')).toString()
);

const folders = {
  server: {
    build: '.backend',
    source: 'backend'
  },

  client: {
    public: 'public',
    source: 'frontend',

    assets: {
      styles: 'styles',
      js: 'js',
      images: 'images',
      icons: 'icons'
    }
  },

  tmp: '.gulp-tmp'
};

const paths = (function () {
  const $p = {};

  /** Server */
  $p.server = {};
  // js
  $p.server.js = {};
  $p.server.js.from   = `./${folders.server.source}/**/*.js`;
  $p.server.js.watch  = `./${folders.server.source}/**/*.js`;
  $p.server.js.to     = `./${folders.server.build}/`;


  /** Client */
  $p.client = {};
  // styles
  $p.client.styles = {};
  $p.client.styles.from   = `./${folders.client.source}/${folders.client.assets.styles}/style.styl`;
  $p.client.styles.watch  = `./${folders.client.source}/${folders.client.assets.styles}/**/*.styl`;
  $p.client.styles.to     = `./${folders.client.public}/css/`;

  // js
  $p.client.js = {};
  $p.client.js.from     = `./${folders.client.source}/${folders.client.assets.js}/index.js`;
  $p.client.js.watch    = `./${folders.client.source}/${folders.client.assets.js}/**/*.js`;
  $p.client.js.to       = `./${folders.client.public}/js/`;

  // images
  $p.client.images = {};
  $p.client.images.from = [
    `./${folders.client.source}/${folders.client.assets.images}/**/*.*`,
    `!./${folders.client.source}/${folders.client.assets.images}/**/_*.*`
  ];
  $p.client.images.watch  = $p.client.images.from;
  $p.client.images.to     = `./${folders.client.public}/images/`;

  // icons 
  $p.client.icons = {};
  $p.client.icons.from = [
    `./${folders.client.source}/${folders.client.assets.icons}/**/*.svg`,
    `!./${folders.client.source}/${folders.client.assets.icons}/**/_*.svg`
  ];
  $p.client.icons.watch  = $p.client.icons.from;
  $p.client.icons.to     = `./${folders.client.public}/icons/`;
  $p.client.icons.tmp    = `./${folders.tmp}/icons/`;

  /** Lint */
  $p.lint = {};
  // styles
  $p.lint.styles = {};
  $p.lint.styles.from     = $p.client.styles.watch;
  $p.lint.styles.watch    = $p.client.styles.watch;

  // js
  $p.lint.js = {};
  $p.lint.js.from = [
    `./${folders.server.source}/**/*.js`,
    `./${folders.client.source}/**/*.js`,
    './gulp/**/*.js',
    './gulpfile.js'
  ];
  $p.lint.js.watch = $p.lint.js.from;

  // templates
  $p.lint.templates = {};
  $p.lint.templates.from = './templates/**/*.jade';
  $p.lint.templates.watch = $p.lint.templates.from;


  /** manifest */
  $p.manifest = {};
  $p.manifest.path = path.join(__dirname, '..');
  $p.manifest.filenames = {};
  $p.manifest.filenames.js = './manifest-js.json';
  $p.manifest.filenames.css = './manifest-css.json';

  return $p;
})();

module.exports = {
  isProduction: isProduction,
  staticAddr:   staticAddr,

  folders: folders,

  paths: paths,

  babel: {
    server: babelServerConfig
  },

  eslint: eslintConfig,
  stylint: stylintConfig,
  puglint: puglintConfig,

  imageResize: imageResizeConfig
};
