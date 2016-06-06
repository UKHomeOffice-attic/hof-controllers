'use strict';

const Controller = require('hmpo-form-wizard').Controller;
const _ = require('lodash');
const lambdas = require('./mixins/lambdas');

module.exports = class BaseController extends Controller {
  constructor(options) {
    super(options);
    this.confirmStep = options.confirmStep || '/confirm';
  }

  getNextStep(req, res) {
    let next = super.getNextStep(req, res);
    const forks = this.options.forks || [];
    const confirmStep = req.baseUrl === '/' ? this.confirmStep : req.baseUrl + this.confirmStep;

    const completed = step => {
      if (req.baseUrl !== '/') {
        const re = new RegExp('^' + req.baseUrl);
        step = step.replace(re, '');
      }
      // Has the user already completed the step?
      return _.includes(req.sessionModel.get('steps'), step);
    };

    // If a form condition is met, its target supercedes the next property
    next = _.reduce(forks, (result, value) => {
      const evalCondition = condition => {
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
  }

  render(req, res) {
    lambdas(req, res);
    super.render(req, res);
  }

  getErrorStep(err, req) {
    let redirect = super.getErrorStep(err, req);
    if (req.params.action === 'edit' && !redirect.match(/\/edit$/)) {
      redirect += '/edit';
    }
    return redirect;
  }

  locals(req, res) {
    const locals = super.locals(req, res);
    const stepLocals = this.options.locals || {};
    const fields = _.map(this.options.fields, (field, key) => ({
      key,
      mixin: field.mixin,
      useWhen: field.useWhen
    }));

    return _.extend({}, locals, {
      fields,
      baseUrl: req.baseUrl,
      nextPage: this.getNextStep(req, res),
      errorLength: this.getErrorLength(req, res),
    }, stepLocals);
  }

  getValues(req, res, callback) {
    super.getValues(req, res, callback);
    const noNext = _.isUndefined(this.options.next);
    const clearSession = this.options.clearSession;
    // clear the session if there's no next step or we request to clear the session
    if ((noNext && clearSession !== false) || clearSession === true) {
      req.sessionModel.reset();
    }
  }

  getErrorLength(req, res) {
    const errors = this.getErrors(req, res);
    const errorLength = Object.keys(errors).length;

    const propName = errorLength === 1 ? 'single' : 'multiple';

    return errorLength ? {
      [propName]: true
    } : undefined;
  }
};
