'use strict';

const _ = require('lodash');
const i18nLookup = require('i18n-lookup');
const BaseError = require('hof-form-controller').Error;

function getArgs(type, args) {
  if (type === 'past') {
    return {
      age: args.join(' ')
    };
  } else if (Array.isArray(args) && typeof type === 'string') {
    var obj = {};
    obj[type] = args[0];
    return obj;
  }
  return {};
}

function compile(t, context) {
  return require('hogan.js').compile(t).render(context);
}

module.exports = class FormError extends BaseError {
  constructor(key, options, req, res) {
    super(key, options, req, res);
    req = req || {};
    if (typeof req.translate === 'function') {
      this.translate = req.translate;
    }
  }

  getMessage(key, options, req, res) {
    res = res || {};
    const keys = [
      'validation.' + key + '.' + options.type,
      'validation.' + key + '.default',
      'validation.' + options.type,
      'validation.default'
    ];
    const context = Object.assign({
      label: this.translate('fields.' + key + '.label').toLowerCase(),
      legend: this.translate('fields.' + key + '.legend').toLowerCase()
    }, res.locals, getArgs(options.type, options.arguments));

    return i18nLookup(this.translate, compile)(keys, context);
  }

  translate() {
    return _.identity.apply(_, arguments);
  }
};
