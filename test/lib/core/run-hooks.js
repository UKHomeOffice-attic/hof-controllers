'use strict';

const proxyquire = require('proxyquire');
const reqres = require('reqres');
const _ = require('lodash');

const testHooksCalled = (fields, hookName, controller) => {
  fields.forEach(field => {
    controller.options.fields[field].hooks[hookName].should.have.been.calledOnce;
  });
  _.map(controller.options.fields, 'hooks')
    .forEach(fieldHooks => {
      _.each(fieldHooks, (hook, key) => {
        if (key !== hookName) {
          hook.should.not.have.been.called;
        }
      });
    });
};

describe('Run Hooks', () => {
  const methodNames = [
    '_getErrors',
    '_getValues',
    '_locals',
    'render',
    '_process',
    '_validate',
    'saveValues',
    'successHandler'
  ];
  let Controller;
  class BaseControllerStub {}

  beforeEach(() => {
    methodNames.forEach(method => {
      BaseControllerStub.prototype[method] = sinon.stub().yields(2);
    });
    Controller = proxyquire('../../../lib/core/run-hooks', {
      './session-io': BaseControllerStub,
      express: {
        Router: () => ({
          use: middleware => ({
            handle: (req, res, next) => middleware.forEach(arg => arg(req, res, next))
          })
        })
      }
    });
  });

  it('has a runHooks method', () => {
    Controller.prototype.should.have.property('runHooks').that.is.a('function');
  });

  it('extends the get and post pipeline methods', () => {
    methodNames.forEach(name => {
      Controller.prototype.should.have.ownProperty(name);
    });
  });

  describe('instance', () => {
    let controller;
    let req;
    let res;
    let next;

    beforeEach(() => {
      controller = new Controller();
      req = reqres.req();
      res = reqres.res();
      next = () => {};
    });

    describe('running hooks', () => {
      beforeEach(function() {
        this.stub(Controller.prototype, 'runHooks').returns(sinon.stub().yields(2));
      });

      it('calls runHooks with the correct hook before and after each pipeline method', () => {
        const getHookName = name => name.replace(/^_/, '');
        methodNames.forEach(name => {
          const hookName = getHookName(name);
          controller[name](req, res, next);

          Controller.prototype.runHooks.should.have.been.calledTwice
            .and.calledWith(`pre-${hookName}`)
            .and.calledWith(`post-${hookName}`);

          Controller.prototype.runHooks.restore();
          sinon.stub(Controller.prototype, 'runHooks').returns(sinon.stub().yields(2));
        });
      });
    });

    describe('runHooks()', () => {
      beforeEach(() => {
        const getMiddlewareStub = () => sinon.stub().returns(sinon.stub().yields(2));
        controller.options = {
          fields: {
            'field-1': {
              hooks: {
                'pre-getErrors': getMiddlewareStub(),
                'post-getErrors': getMiddlewareStub()
              }
            },
            'field-2': {
              hooks: {
                'pre-getErrors': getMiddlewareStub(),
                'pre-render': getMiddlewareStub(),
                'post-process': getMiddlewareStub()
              }
            },
            'field-3': {
              hooks: {
                'pre-getErrors': getMiddlewareStub(),
                'pre-render': getMiddlewareStub(),
                'post-render': getMiddlewareStub()
              }
            }
          }
        };
      });

      it('calls pre-getErrors hooks', () => {
        const fields = ['field-1', 'field-2', 'field-3'];
        const hookName = 'pre-getErrors';
        controller.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, controller);
      });

      it('calls post-getErrors hooks', () => {
        const fields = ['field-1'];
        const hookName = 'post-getErrors';
        controller.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, controller);
      });

      it('calls pre-render hooks', () => {
        const fields = ['field-2', 'field-3'];
        const hookName = 'pre-render';
        controller.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, controller);
      });

      it('calls post-process hooks', () => {
        const fields = ['field-2'];
        const hookName = 'post-process';
        controller.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, controller);
      });

      it('calls post-render hooks', () => {
        const fields = ['field-3'];
        const hookName = 'post-render';
        controller.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, controller);
      });
    });
  });
});
