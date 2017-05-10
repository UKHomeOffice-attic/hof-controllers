'use strict';

/* eslint-disable no-console */
console.error('hof-controllers is now DEPRECATED please see the README.md for more info.');
/* eslint-enable no-console */

module.exports = {
  form: require('./lib/form-controller'),
  base: require('./lib/base-controller'),
  date: require('./lib/date-controller'),
  confirm: require('./lib/confirm-controller'),
  error: require('./lib/error'),
  start: require('./lib/start-controller')
};
