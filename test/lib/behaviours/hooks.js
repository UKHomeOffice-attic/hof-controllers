'use strict';

const proxyquire = require('proxyquire');
const reqres = require('reqres');
const _ = require('lodash');
const HooksBehaviour = proxyquire('../../../lib/behaviours/hooks', {
  express: {
    Router: () => ({
      use: middleware => ({
        handle: (req, res, next) => middleware.forEach(arg => arg(req, res, next))
      })
    })
  }
});

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
  let Hooks;
  class Controller {}

  beforeEach(() => {
    methodNames.forEach(method => {
      Controller.prototype[method] = sinon.stub().yields(2);
    });
    Hooks = HooksBehaviour(Controller);
  });

  it('has a runHooks method', () => {
    Hooks.prototype.should.have.property('runHooks').that.is.a('function');
  });

  it('extends the get and post pipeline methods', () => {
    methodNames.forEach(name => {
      Hooks.prototype.should.have.ownProperty(name);
    });
  });

  describe('instance', () => {
    let hooks;
    let req;
    let res;
    let next;

    beforeEach(() => {
      hooks = new Hooks();
      req = reqres.req();
      res = reqres.res();
      next = () => {};
    });

    describe('running hooks', () => {
      beforeEach(function() {
        this.stub(Hooks.prototype, 'runHooks').returns(sinon.stub().yields(2));
      });

      it('calls runHooks with the correct hook before and after each pipeline method', () => {
        const getHookName = name => name.replace(/^_/, '');
        methodNames.forEach(name => {
          const hookName = getHookName(name);
          hooks[name](req, res, next);

          Hooks.prototype.runHooks.should.have.been.calledTwice
            .and.calledWith(`pre-${hookName}`)
            .and.calledWith(`post-${hookName}`);

          Hooks.prototype.runHooks.restore();
          sinon.stub(Hooks.prototype, 'runHooks').returns(sinon.stub().yields(2));
        });
      });
    });

    describe('runHooks()', () => {
      beforeEach(() => {
        const getMiddlewareStub = () => sinon.stub().returns(sinon.stub().yields(2));
        hooks.options = {
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
        hooks.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, hooks);
      });

      it('calls post-getErrors hooks', () => {
        const fields = ['field-1'];
        const hookName = 'post-getErrors';
        hooks.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, hooks);
      });

      it('calls pre-render hooks', () => {
        const fields = ['field-2', 'field-3'];
        const hookName = 'pre-render';
        hooks.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, hooks);
      });

      it('calls post-process hooks', () => {
        const fields = ['field-2'];
        const hookName = 'post-process';
        hooks.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, hooks);
      });

      it('calls post-render hooks', () => {
        const fields = ['field-3'];
        const hookName = 'post-render';
        hooks.runHooks(hookName)(req, res, next);
        testHooksCalled(fields, hookName, hooks);
      });
    });
  });
});
