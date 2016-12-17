'use strict';
/** Requires */
import fs           from 'fs';
import path         from 'path';

import uuid         from 'node-uuid';
import fileExists   from 'file-exists';
import yaml         from 'js-yaml';

import Confinger    from 'confinger';

/** Constant */
const configFilePath = path.join(__dirname, '../../config.yml');

/** Init */
const config = new Confinger({
  emitError: true
});

/** Defaults */
config
  .add({
    // Environment
    environment: 'development',

    // Logs
    logsDir: path.join(__dirname, '../../logs/'),

    // Tmp
    tmpDir: path.join(__dirname, '../../tmp/'),

    // Server
    server: {
      port: '3000',
      session: {
        secret: uuid.v4()
      }
    },

    // Static Addr
    staticAddr: '',

    // MongoDB
    db: {
      user: 'guest',
      pass: 'guest',
      host: 'localhost',
      port: '27017',
      base: 'test'
    },

    // Session Store
    sessionStore: {
      host:       'localhost',
      port:       '6379',
      db:         '0',
      pass:       null
    }
  });

/** config.yml */
if (fileExists(configFilePath)) {
  const configYml = yaml.load(
    fs.readFileSync(configFilePath).toString()
  );

  config.add(configYml);
}

/** Process Env */
config
  .add({
    // Enviroment
    environment: process.env.NODE_ENV,

    // Logs
    logsDir: process.env.NODE_LOGS_PATH,

    // Server
    server: {
      port: process.env.NODE_PORT,
      session: {
        secret: process.env.NODE_SECRET
      }
    },

    // Static Addr
    staticAddr: process.env.NODE_STATIC_ADDR,

    // MongoDB
    db: {
      user: process.env.NODE_DB_USER,
      pass: process.env.NODE_DB_PASS,
      host: process.env.NODE_DB_HOST,
      port: process.env.NODE_DB_PORT,
      base: process.env.NODE_DB_BASE
    },

    // Session Store
    sessionStore: {
      host: process.env.NODE_SESSION_HOST,
      port: process.env.NODE_SESSION_PORT,
      db:   process.env.NODE_SESSION_DB,
      pass: process.env.NODE_SESSION_PASS
    }
  });

export default config;
