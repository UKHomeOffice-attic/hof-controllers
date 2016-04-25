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

/*
 * Utility function which accepts an array of invalidating fields
 * and the steps config object, returns a filtered steps object
 * containing fields which have been invalidated.
 */
function getStepsToCheck(fields, steps) {
  return _.pick(steps, function pickSteps(step) {
    if (!step.fields) {
      return false;
    }
    return _.intersection(step.fields, fields).length;
  });
}

/*
 * Utility function which accepts an array of invalidating fields,
 * the steps config object and the sessionModel. It returns an array
 * of step names for which all fields have been invalidated.
 */
function getInvalidatedSteps(fields, steps, sessionModel) {
  var stepsToCheck = getStepsToCheck(fields, steps);

  return _.chain(stepsToCheck).pick(function pickSteps(step) {
    return _.every(step.fields, function everyField(item) {
      return sessionModel.get(item) === undefined;
    });
  }).keys().value();
}

BaseController.prototype.saveValues = function saveValues(req) {
  this.invalidateSteps(req);
  Controller.prototype.saveValues.apply(this, arguments);
};

/*
 * Remove any steps from the sessionModel
 * that have had all of their fields invalidated
 */
BaseController.prototype.invalidateSteps = function invalidateSteps(req) {
  var steps = this.options.steps;
  var invalidatingFields = _.pick(this.options.fields, function pickFields(field) {
    return field && field.invalidates && field.invalidates.length;
  });
  _.each(invalidatingFields, function eachInvalidatingField(field, key) {
    req.sessionModel.on('change:' + key, function onChange() {
      var invalidatedSteps = getInvalidatedSteps(field.invalidates, steps, req.sessionModel);
      req.sessionModel.set('steps', _.difference(req.sessionModel.get('steps'), invalidatedSteps));
    });
  });
};

BaseController.prototype.getNextStep = function getNextStep(req, res) {
  var next = Controller.prototype.getNextStep.apply(this, arguments);
  var forks = this.options.forks || [];
  var confirmStep = req.baseUrl === '/' ? this.confirmStep : req.baseUrl + this.confirmStep;

  var completed = function completed(step) {
    // Has the user already completed the step?
    return _.includes(req.sessionModel.get('steps'), step);
  };

  // If a form condition is met, its target supercedes the next property
  next = _.reduce(forks, function forkFold(result, value) {
    var evalCondition = function evalCondition(condition) {
      return _.isFunction(condition) ?
        condition(req, res) :
        condition.value === req.form.values[condition.field];
    };

    return evalCondition(value.condition) ?
      req.baseUrl + value.target :
      result;
  }, next);

  if ((req.params.action === 'edit') && completed(next)) {
    // The user is editing the form and has already completed the next
    // step, so let's check whether we should fast-forward them to the
    // confirm page
    next = (!this.options.continueOnEdit || next === confirmStep) ?
      confirmStep :
      next + '/edit';
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
