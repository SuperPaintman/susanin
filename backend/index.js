'use strict';
/** Requires */
import 'source-map-support/register';
import 'babel-polyfill';

import './libs/mongoose';
import './models';

import path         from 'path';

import express      from 'express';
import exa          from 'exa';

import config       from './libs/config';
import logger       from './libs/logger';

/** Constants */
const port          = parseInt(config.get('server.port'), 10);

const environment   = config.get('environment');

const isProduction  = environment === 'production';

/** Init */
const app = exa(express());

/** Settitngs */
// Env
app.set('env is production', isProduction);

// Templates
app.set('view engine', 'jade');
app.set('views',  path.join(__dirname, '../templates/views'));
app.set('view cache', app.get('env is production'));

// Server
app.set('x-powered-by', false);
app.set('trust proxy', true);

// Static
app.use('/public', express.static(path.join(__dirname, '../public'), {
  maxAge: 0
}));

// Debug
app.set('debug', !app.get('env is production'));

/** Logs */
logger.info('config:', config.getAll());

/** Middleware */
import middlewares from './middlewares/';
middlewares(app);

/** Routes */
import routes from './routes/';
routes(app);

/** Start */
if (!module.parent) {
  app.listen(port, () => {
    logger.info(`Backend app listening on port ${port}!`);
  });
}

export default app;
