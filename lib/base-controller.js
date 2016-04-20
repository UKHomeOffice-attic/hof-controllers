'use strict';

var Controller = require('hmpo-form-wizard').Controller;
var util = require('util');
var _ = require('lodash');

var BaseController = function BaseController(options) {
  this.confirmStep = options.confirmStep || '/confirm';
  Controller.apply(this, arguments);
};

util.inherits(BaseController, Controller);

function getErrorLength() {
  var errors = this.getErrors.apply(this, arguments);
  var errorLength = Object.keys(errors).length;

  if (errorLength === 1) {
    return {single: true};
  }
  if (errorLength > 1) {
    return {multiple: true};
  }
}

BaseController.prototype.getNextStep = function getNextStep(req, res) {
  var next = Controller.prototype.getNextStep.apply(this, arguments);
  var forked = false;
  var forks = this.options.forks || [];

  _.each(forks, function eachFork(fork) {
    if (_.isFunction(fork.condition)) {
      if (fork.condition(req, res)) {
        if (!_.includes(req.sessionModel.get('steps'), fork.target)) {
          next = req.baseUrl + fork.target;
          forked = true;
        }
      }
    }
    if (_.isPlainObject(fork.condition)) {
      if (fork.condition.value === req.form.values[fork.condition.field]) {
        if (!_.includes(req.sessionModel.get('steps'), fork.target)) {
          next = req.baseUrl + fork.target;
          forked = true;
        }
      }
    }
  });

  if (forked) {
    return next;
  } else if (req.params.action === 'edit' && !this.options.continueOnEdit) {
    next = req.baseUrl === '/' ? this.confirmStep : req.baseUrl + this.confirmStep;
  } else if (req.params.action === 'edit') {
    next += '/edit';
  }

  return next;

};

BaseController.prototype.getErrorStep = function getErrorStep(err, req) {
  var redirect = Controller.prototype.getErrorStep.call(this, err, req);
  if (req.params.action === 'edit' && !redirect.match(/\/edit$/)) {
    redirect += '/edit';
  }
  return redirect;
};

BaseController.prototype.locals = function controllerLocals(req, res) {
  var locals = Controller.prototype.locals.apply(this, arguments);
  var stepLocals = this.options.locals || {};

  return _.extend({}, locals, {
    baseUrl: req.baseUrl,
    nextPage: this.getNextStep(req, res),
    errorLength: getErrorLength.apply(this, arguments)
  }, stepLocals);
};

BaseController.prototype.getValues = function getValues(req, res, callback) {
  Controller.prototype.getValues.call(this, req, res, callback);
  // clear the session if there's no next step or we request to clear the session
  if ((_.isUndefined(this.options.next) && this.options.clearSession !== false) || this.options.clearSession === true) {
    req.sessionModel.reset();
  }
};

module.exports = BaseController;
