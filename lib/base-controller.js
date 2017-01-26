'use strict';

const _ = require('lodash');
const i18nLookup = require('i18n-lookup');
const Mustache = require('mustache');
const helpers = require('./util/helpers');
const Controller = require('hof-form-wizard').Controller;
const lambdas = require('./middleware/lambdas');

module.exports = class BaseController extends Controller {
  constructor(options) {
    super(options);
    this.confirmStep = options.confirmStep || '/confirm';
    this.use(lambdas());
    this.applyComponents();
  }

  applyComponents() {
    _(this.options.fields)
      .pickBy(field => field.component && typeof field.component === 'function')
      .each((field, key) => {
        this.use(field.component(Object.assign({}, field, {key})).requestHandler());
      });
  }

  get(req, res, callback) {
    const template = this.options.template || '';
    res.render(template, err => {
      if (err && err.message.match(/^Failed to lookup view/)) {
        this.options.template = res.locals.partials.step;
      }
    });
    super.get(req, res, callback);
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

  getBackLink(req, res) {
    const backLink = res.locals.backLink;
    const trailingEdit = req.params.action === 'edit' ? '/edit' : '';
    const leadingSlash = /^\/?\w+/.test(req.baseUrl) ? '' : '/';

    if (!backLink) {
      return backLink;
    }

    return `${leadingSlash}${backLink}${trailingEdit}`;
  }

  getErrorStep(err, req) {
    let redirect = super.getErrorStep(err, req);
    if (req.params.action === 'edit' && !redirect.match(/\/edit$|\/edit\//)) {
      redirect += '/edit';
    }
    return redirect;
  }

  getErrors(req, res) {
    let errs = super.getErrors(req, res);
    var componentErrors = req.sessionModel.get('componentErrors');
    errs = Object.assign({}, errs, componentErrors);
    return errs;
  }

  locals(req, res) {
    const lookup = i18nLookup(req.translate, Mustache.render);
    const route = this.options.route.replace(/^\//, '');
    const locals = super.locals(req, res);
    const stepLocals = this.options.locals || {};

    const fields = _.map(this.options.fields, (field, key) => ({
      key,
      mixin: field.mixin,
      useWhen: field.useWhen,
      html: res.locals[key]
    }));

    return _.extend({}, locals, {
      fields,
      route,
      baseUrl: req.baseUrl,
      title: helpers.getTitle(route, lookup, this.options.fields, res.locals),
      intro: helpers.getIntro(route, lookup, res.locals),
      backLink: this.getBackLink(req, res),
      nextPage: this.getNextStep(req, res),
      errorLength: this.getErrorLength(req, res)
    }, stepLocals);
  }

  getValues(req, res, callback) {
    super.getValues(req, res, (err, values) => {
      if (err) {
        return callback(err, values);
      }
      const noNext = _.isUndefined(this.options.next);
      const clearSession = this.options.clearSession;
      // clear the session if there's no next step or we request to clear the session
      if ((noNext && clearSession !== false) || clearSession === true) {
        req.sessionModel.reset();
      }
      return callback(null, values);
    });
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
