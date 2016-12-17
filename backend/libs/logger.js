'use strict';
/** Requires */
import path                     from 'path';

import winston                  from 'winston';
import WinstonDailyRotateFile   from 'winston-daily-rotate-file';
import _                        from 'lodash';
import dateformat               from 'dateformat';
import chalk                    from 'chalk';
import mkdirp                   from 'mkdirp';

import config                   from './config';

/** Constant */
const CONSOLE_DATE_FORMAT = 'mm.dd HH:MM:ss';
const INDENT_IN_LOG       = _.repeat(' ', 4);

const logsDir = config.get('logsDir');

const isProduction = config.get('environment') === 'production';

/** Init */
mkdirp.sync(logsDir);

const logger = new winston.Logger({
  transports: (function () {
    const transports = [];

    transports.push(new winston.transports.Console({
      prettyPrint: function (obj) {
        const jsonStr = JSON.stringify(obj, true, 2)
          .split('\n')
          .map((str) => INDENT_IN_LOG + str)
          .join('\n');

        return '\n' + jsonStr;
      },
      timestamp: function () {
        return `${
          chalk.gray('[')
        }${
          dateformat(new Date(), CONSOLE_DATE_FORMAT)
        }${
          chalk.gray(']')
        }`;
      },
      colorize: true,
      showLevel: true,
      level: isProduction ? 'info' : 'debug'
    }));

    if (isProduction) {
      transports.push(new WinstonDailyRotateFile({
        filename: path.join(logsDir, 'logger'),
        datePattern: '.yyyy-MM-dd.log',
        maxsize: 20000
      }));
    }

    return transports;
  })(),
  levels: {
    fatal: 0,
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    trace: 4,
    debug: 4
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'cyan',
    info: 'gray',
    verbose: 'yellow',
    trace: 'gray',
    debug: 'magenta'
  }
});

export default logger;
