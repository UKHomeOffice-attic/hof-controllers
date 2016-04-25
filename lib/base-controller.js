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

// Accepts a step and the steps config object
// returns an array of all step names that
// can be reached from the given step
function getAllPossibleSteps(stepName, steps) {
  var allSteps = [stepName];
  var step = steps[stepName];
  while (step && step.next) {
    allSteps.push(step.next);
    var forks = step.forks || [];
    /*eslint-disable no-loop-func*/
    allSteps = allSteps.concat(forks.reduce(function getForks(arr, fork) {
      /*eslint-enable no-loop-func*/
      return getAllPossibleSteps(fork.target, steps);
    }, []));
    step = steps[step.next];
  }
  return _.uniq(allSteps);
}

BaseController.prototype.getNextStep = function getNextStep(req, res) {
  var next = Controller.prototype.getNextStep.apply(this, arguments);
  // We only want to execute forking logic on POST requests
  if (req.method !== 'POST') {
    return next;
  }
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

    var conditionSatisfied = evalCondition(value.condition);

    // if fork condition satisfied, invalidate next path
    // if not, invalidate fork target path
    if (conditionSatisfied) {
      this.invalidatePath(this.options.next, value.target, req.sessionModel);
    } else {
      this.invalidatePath(value.target, this.options.next, req.sessionModel);
    }

    return conditionSatisfied ?
      req.baseUrl + value.target :
      result;
  }.bind(this), next);

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

// Accepts start point of journey to invalidate, start point of journey
// not to invalidate and the sessionModel. Calls invalidateSteps on all
// steps that are reachable via invalidateStart but not validateStart
BaseController.prototype.invalidatePath = function invalidatePath(invalidateStart, validateStart, sessionModel) {
  var invalidateSteps = getAllPossibleSteps(invalidateStart, this.options.steps);
  var validateSteps = getAllPossibleSteps(validateStart, this.options.steps);

  _.difference(invalidateSteps, validateSteps).forEach(function eachStep(step) {
    this.invalidateStep(step, sessionModel);
  }.bind(this));
};

// Accepts a string stepName and the sessionModel.
// Unsets all fields for the given step, and removes
// step from step history.
BaseController.prototype.invalidateStep = function invalidateStep(stepName, sessionModel) {
  var step = this.options.steps[stepName] || {};
  sessionModel.unset(step.fields);
  var steps = _.without(sessionModel.get('steps'), stepName);
  sessionModel.set('steps', steps);
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
