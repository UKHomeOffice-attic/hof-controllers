'use strict';

var Controller = require('hmpo-form-wizard').Controller;
var util = require('util');
var _ = require('underscore');

var BaseController = function BaseController() {
  this.confirmStep = '/confirm';
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
  var forks = (this.options || {}).forks || [];

  _.each(forks, function eachFork(fork) {
    if (_.isFunction(fork.condition)) {
      if (fork.condition(req, res)) {
        next = req.baseUrl + fork.target;
      }
    }
    if (_.isObject(fork.condition)) {
      if (fork.condition.value === req.form.values[fork.condition.field]) {
        next = req.baseUrl + fork.target;
      }
    }
  });

  if (req.params.action === 'edit' && !this.options.continueOnEdit) {
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
  return _.extend({}, locals, {
    baseUrl: req.baseUrl,
    nextPage: this.getNextStep(req, res),
    errorLength: getErrorLength.apply(this, arguments)
  });
};

BaseController.prototype.getValues = function getValues(req, res, callback) {
  Controller.prototype.getValues.call(this, req, res, callback);
  // clear the session if there's no next step or we request to clear the session
  if ((_.isUndefined(this.options.next) && this.options.clearSession !== false) || this.options.clearSession === true) {
    req.sessionModel.reset();
  }
};

module.exports = BaseController;
