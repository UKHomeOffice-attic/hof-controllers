'use strict';

const _ = require('lodash');
const BaseController = require('./session-io');
const Router = require('express').Router;

class Controller extends BaseController {
  runHooks(hook) {
    return (req, res, next) => {
      // find the fields which have the current hook defined
      const hooks = _(this.options.fields)
        .filter(field => field.hooks)
        .map('hooks')
        .filter(h => h[hook])
        .map(hook)
        .value();
      if (hooks.length) {
        Router().use(hooks).handle(req, res, next);
      } else {
        next();
      }
    };
  }
}

[
  // GET pipeline
  '_getErrors',
  '_getValues',
  '_locals',
  'render',
  // POST pipeline
  '_process',
  '_validate',
  'saveValues',
  'successHandler'
].forEach(method => {
  /* eslint-disable func-names */
  Controller.prototype[method] = function (req, res, next) {
    /* eslint-enable func-names */
    const methodName = method.replace(/^_/, '');
    Router().use([
      this.runHooks(`pre-${methodName}`),
      BaseController.prototype[method].bind(this),
      this.runHooks(`post-${methodName}`)
    ]).handle(req, res, next);
  };
});

module.exports = Controller;
