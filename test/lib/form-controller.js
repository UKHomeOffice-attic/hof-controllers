'use strict';

const Controller = require('../../lib/form-controller');
const ErrorClass = require('../../lib/error');
const Form = require('hof-form-controller');
const Model = require('hof-model');
const request = require('reqres').req;
const response = require('reqres').res;

describe('Form Controller', () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = request({
        sessionModel: new Model()
    });
    res = response();
    next = sinon.stub();
    controller = new Controller({
      template: 'index',
      fields: {
        field1: {},
        field2: {}
      }
    });
  });

  describe('validators', () => {
    it('exposes validators', () => {
      Controller.validators.should.eql(Form.validators);
    });
  });

  describe('formatters', () => {
    it('exposes formatters', () => {
      Controller.formatters.should.eql(Form.formatters);
    });
  });

  describe('Error', () => {
    it('is an instance of Wizard.Error', () => {
      const err = new controller.Error('key', { type: 'required' });
      err.should.be.an.instanceOf(ErrorClass);
    });
  });

  describe('getErrors', () => {
    it('only returns errors from fields relevant to the current step', () => {
      req.sessionModel.set('errors', {
        field1: 'foo',
        field3: 'bar'
      });
      const errors = controller.getErrors(req, res);
      errors.should.eql({ field1: 'foo' });
    });

    it('does not return errors with a redirect property', () => {
      req.sessionModel.set('errors', {
        field1: {
          redirect: '/exit-page'
        },
        field2: {
          message: 'message'
        }
      });
      const errors = controller.getErrors(req, res);
      errors.should.eql({ field2: { message: 'message' } });
    });
  });

  describe('errorHandler', () => {
    beforeEach(() => {
      sinon.stub(Form.prototype, 'errorHandler');
      sinon.stub(Controller.prototype, 'missingPrereqHandler');
    });

    afterEach(() => {
      Form.prototype.errorHandler.restore();
      Controller.prototype.missingPrereqHandler.restore();
    });

    it('calls missingPrereqHandler for missing prerquisite errors', () => {
      const err = new Error('foo');
      err.code = 'MISSING_PREREQ';
      controller.errorHandler(err, req, res, next);
      controller.missingPrereqHandler.should.have.been.calledWithExactly(req, res, next);
    });

    it('passes through to parent errorHandler for all other errors', () => {
      const err = new Error('foo');
      controller.errorHandler(err, req, res, next);
      Form.prototype.errorHandler.should.have.been.calledWithExactly(err, req, res, next);
      Form.prototype.errorHandler.should.have.been.calledOn(controller);
    });
  });

  describe('missingPrereqHandler', () => {
    beforeEach(() => {
      controller.options.steps = {
        '/one': { next: '/two' },
        '/two': { next: '/three' },
        '/three': { next: '/four' },
        '/four': {}
      };
    });

    it('redirects to the step following the most recently completed', () => {
      req.sessionModel.set('steps', ['/one']);
      controller.missingPrereqHandler(req, res, next);
      res.redirect.should.have.been.calledWith('/two');
    });

    it('redirects to the first step if no steps have been completed', () => {
      req.sessionModel.set('steps', []);
      controller.missingPrereqHandler(req, res, next);
      res.redirect.should.have.been.calledWith('/one');
    });
  });
});
