'use strict';

const _ = require('lodash');
const proxyquire = require('proxyquire');

describe('lib/base-controller', () => {

  let hofFormWizard;
  let Controller;
  let controller;

  beforeEach(() => {
    hofFormWizard = require('hof-form-wizard');
  });

  describe('constructor', () => {

    beforeEach(() => {
      hofFormWizard.Controller = sinon.stub(hofFormWizard, 'Controller', function (options) {
        this.options = options;
      });
      Controller = proxyquire('../../lib/base-controller', {
        'hof-form-wizard': hofFormWizard,
        './middleware/mixins': {}
      });
      Controller.prototype.use = sinon.stub();
      sinon.spy(Controller.prototype, 'applyComponents');
    });

    afterEach(() => {
      Controller.prototype.applyComponents.restore();
      hofFormWizard.Controller.restore();
    });

    it('calls the parent constructor', () => {
      controller = new Controller({
        template: 'foo'
      });
      hofFormWizard.Controller.should.have.been.called;
    });

    it('calls applyComponents', () => {
      controller = new Controller({
        template: 'foo'
      });
      Controller.prototype.applyComponents.should.have.been.calledOnce
        .and.calledWithExactly();
    });

  });

  describe('methods', () => {

    beforeEach(() => {
      hofFormWizard.Controller.prototype.getNextStep = sinon.stub();
      Controller = proxyquire('../../lib/base-controller', {
        'hof-form-wizard': hofFormWizard,
        'i18n-lookup': function() {
          return function () {};
        }
      });
    });

    describe('.applyComponents()', () => {
      let fields;
      let componentStub;
      let requestHandlerStub;
      beforeEach(() => {
        requestHandlerStub = sinon.stub().returns(true);
        componentStub = sinon.stub().returns({
          requestHandler: requestHandlerStub
        });
        fields = {
          'a-field': {
            mixin: 'input-text'
          },
          'component-field': {
            component: componentStub
          }
        };
        controller.use = sinon.stub();
        controller.options.fields = fields;
        controller.applyComponents();
      });

      it('should have called componentStub with the config from component-field', () => {
        componentStub.should.have.been.calledOnce.and.calledWithMatch(Object.assign({}, fields['component-field'], {
          key: 'component-field'
        }));
      });

      it('should have called use with the result of requestHandler', () => {
        controller.use.should.have.been.calledOnce.and.calledWithExactly(requestHandlerStub());
      });
    });

    describe('.get()', () => {
      const req = {};
      const res = {
        locals: {
          partials: {
            step: 'default-template'
          }
        }
      };

      beforeEach(() => {
        res.render = sinon.stub();
        hofFormWizard.Controller.prototype.get = sinon.stub();
        controller = new Controller({
          template: 'foo'
        });
      });

      it('calls super', () => {
        controller.get(req, res, _.noop);
        hofFormWizard.Controller.prototype.get.should.have.been.calledOnce
          .and.calledWithExactly(req, res, _.noop);
      });

      it('calls res.render with the template', () => {
        controller.get(req, res, _.noop);
        res.render.should.have.been.calledOnce;
      });

      it('sets template to res.locals.partials.step if view lookup error', () => {
        res.render = (template, cb) => cb(new Error('Failed to lookup view'));
        controller.get(req, res, _.noop);
        controller.options.template.should.be.equal('default-template');
      });

    });

    describe('.getBackLink()', () => {
      const req = {};
      const res = {
        locals: {}
      };

      beforeEach(() => {
        res.locals.backLink = '';
        req.baseUrl = '/base';
        req.params = {};
        controller = new Controller({
          template: 'foo'
        });
      });

      it('returns an empty string if res.locals.backLink is an empty string', () => {
        controller.getBackLink(req, res).should.be.equal('');
      });

      it('returns null if res.locals.backLink is null', () => {
        res.locals.backLink = null;
        should.not.exist(controller.getBackLink(req, res));
      });

      it('returns the backLink unaltered if not editing and baseUrl is set', () => {
        res.locals.backLink = 'backLink';
        controller.getBackLink(req, res).should.be.equal('backLink');
      });

      it('prepends a slash if baseUrl is /', () => {
        res.locals.backLink = 'backLink';
        req.baseUrl = '/';
        controller.getBackLink(req, res).should.be.equal('/backLink');
      });

      it('prepends a slash if baseUrl is an empty string', () => {
        res.locals.backLink = 'backLink';
        req.baseUrl = '';
        controller.getBackLink(req, res).should.be.equal('/backLink');
      });

      it('appends /edit if editing', () => {
        req.params.action = 'edit';
        res.locals.backLink = 'backLink';
        controller.getBackLink(req, res).should.be.equal('backLink/edit');
      });

      it('appends /edit and prepends a slash if editing and baseUrl not set', () => {
        req.params.action = 'edit';
        req.baseUrl = '/';
        res.locals.backLink = 'backLink';
        controller.getBackLink(req, res).should.be.equal('/backLink/edit');
      });
    });

    describe('.getErrors()', () => {
      let errs;
      let componentErrs;
      let req = {
        sessionModel: {}
      };
      let res = {};

      beforeEach(() => {
        errs = {
          'field-1': {
            type: 'required'
          }
        };
        componentErrs = {
          'component': {
            type: 'future'
          }
        };
        req.sessionModel.get = sinon.stub().returns(componentErrs);
        hofFormWizard.Controller.prototype.getErrors = sinon.stub().returns(errs);
      });

      it('calls super', () => {
        controller.getErrors(req, res);
        hofFormWizard.Controller.prototype.getErrors.should.have.been.calledOnce
          .and.calledWithExactly(req, res);
      });

      it('extends standard errors with errors from components', () => {
        controller.getErrors(req, res).should.be.deep.equal(Object.assign({}, errs, componentErrs));
      });
    });

    describe('.locals()', () => {

      const req = {
        params: {}
      };
      const res = {};

      beforeEach(() => {
        hofFormWizard.Controller.prototype.locals = sinon.stub().returns({foo: 'bar'});
        sinon.stub(Controller.prototype, 'getBackLink');
        sinon.stub(Controller.prototype, 'getErrorLength');
        Controller.prototype.getErrorLength.returns({single: true});
        controller = new Controller({
          template: 'foo',
          route: '/bar'
        });
      });

      afterEach(() => {
        Controller.prototype.getBackLink.restore();
        Controller.prototype.getErrorLength.restore();
      });

      it('always extends from parent locals', () => {
        controller.locals(req, res).should.have.property('foo').and.always.equal('bar');
      });

      it('returns errorLength.single if there is one error', () => {
        controller.locals(req, res).should.have.property('errorLength')
          .and.deep.equal({
            single: true
          });
      });

      it('calls getBackLink', () => {
        controller.locals(req, res);
        Controller.prototype.getBackLink.should.have.been.calledOnce;
      });

      it('returns errorLength.multiple if there is more than one error', () => {
        Controller.prototype.getErrorLength.returns({multiple: true});
        controller.locals(req, res).should.have.property('errorLength')
          .and.deep.equal({
            multiple: true
          });
      });

      describe('with fields', () => {
        let locals;
        beforeEach(() => {
          res.locals = {
            'another-field': '<h1>hi</h1>'
          };
          controller.options.fields = {
            'a-field': {
              mixin: 'input-text'
            },
            'another-field': {
              mixin: 'input-number'
            }
          };
          locals = controller.locals(req, res);
        });

        it('should have added a fields array to return object', () => {
          locals.should.have.property('fields').and.be.an('array');
        });

        it('should have added 2 items to the fields array', () => {
          locals.fields.length.should.be.equal(2);
        });

        it('should have added \'a-field\' as \'key\' property to the first object', () => {
          locals.fields[0].key.should.be.equal('a-field');
        });

        it('should have added \'input-text\' as \'mixin\' property to the first object', () => {
          locals.fields[0].mixin.should.be.equal('input-text');
        });

        it('should have added a html propety to \'another-field\' with the value taken from res.locals', () => {
          locals.fields[1].html.should.be.equal('<h1>hi</h1>');
        });
      });

      describe('with locals', () => {
        beforeEach(() => {
          res.locals = {};
          res.locals.values = {
            'field-one': 1,
            'field-two': 2,
            'field-three': 3,
            'field-four': 4
          };

          controller.options = {
            steps: {
              '/one': {
                fields: ['field-one', 'field-two']
              },
              '/two': {
                fields: ['field-three', 'field-four']
              }
            },
            locals: {
              test: 'bar',
            },
            route: '/baz'
          };
        });

        it('should expose test in locals', () => {
          controller.locals(req, res).should.have.property('test').and.equal('bar');
        });
      });
    });

    describe('.getValues()', () => {
      const res = {};
      let req = {
        params: {}
      };
      let callback;

      beforeEach(() => {
        hofFormWizard.Controller.prototype.getValues = sinon.stub().yields();
        Controller.prototype.getErrorLength = sinon.stub();
        req = {
          sessionModel: {
            reset: sinon.stub()
          },
          header: sinon.stub()
        };
        callback = sinon.stub();
      });

      describe('when there\'s a next step', () => {

        beforeEach(() => {
          controller = new Controller({
            template: 'foo'
          });
          controller.options = {
            next: '/somepage'
          };
          controller.getValues(req, res, callback);
        });

        it('resets the session', () => {
          req.sessionModel.reset.should.not.have.been.called;
        });

      });

      describe('when there\'s no next step', () => {

        beforeEach(() => {
          controller = new Controller({template: 'foo'});
          controller.options = {};
          controller.getValues(req, res, callback);
        });

        it('resets the session', () => {
          req.sessionModel.reset.should.have.been.calledOnce;
        });

      });

      describe('when there\'s no next step but clearSession is false', () => {

        beforeEach(() => {
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: false
          };
          controller.getValues(req, res, callback);
        });

        it('resets the session', () => {
          req.sessionModel.reset.should.not.have.been.calledOnce;
        });

      });

      describe('when clearSession is set', () => {

        beforeEach(() => {
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: true
          };
          controller.getValues(req, res, callback);
        });

        it('resets the session', () => {
          req.sessionModel.reset.should.have.been.calledOnce;
        });

        it('resets the session before callback is called', () => {
          req.sessionModel.reset.should.have.been.calledBefore(callback);
        });

      });

      describe('when parent controller getValues errors', () => {

        let error;

        beforeEach(() => {
          error = 'Parent getValues error.';
          hofFormWizard.Controller.prototype.getValues = sinon.stub().yields(error);
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: true
          };
          controller.getValues(req, res, callback);
        });

        it('immediately fires the callback with the error', () => {
          callback.should.have.been.calledWith(error);
          req.sessionModel.reset.should.not.have.been.called;
        });

      });

      it('always calls the parent controller getValues', () => {
        controller = new Controller({template: 'foo'});
        controller.options = {};
        controller.getValues(req, res, callback);
        hofFormWizard.Controller.prototype.getValues
          .should.always.have.been.calledWith(req, res);
      });

    });

    describe('.getNextStep()', () => {
      const req = {};
      let getStub;

      beforeEach(() => {
        getStub = sinon.stub();
        getStub.returns(['/']);
        hofFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/');
        req.baseUrl = '';
        req.params = {};
        req.sessionModel = {
          reset: sinon.stub(),
          get: getStub
        };
        controller = new Controller({template: 'foo'});
        controller.options = {};
      });

      describe('when the action is "edit"', () => {
        it('appends "edit" to the path', () => {
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/edit');
        });
      });

      describe('when the action is "edit" and continueOnEdit option is falsey', () => {
        it('appends "confirm" to the path', () => {
          controller.options.continueOnEdit = false;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/confirm');
        });
      });

      describe('when the action is "edit" and continueOnEdit is truthy', () => {
        it('appends "/edit" to the path if next page is not /confirm', () => {
          hofFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/step');
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          getStub.returns(['/step']);
          controller.getNextStep(req).should.contain('/edit');
        });

        it('doesn\'t append "/edit" to the path if next page is /confirm', () => {
          hofFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/confirm');
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          controller.getNextStep(req).should.not.contain('/edit');
        });
      });

      describe('with a fork', () => {
        beforeEach(() => {
          getStub = sinon.stub();
          req.sessionModel = {
            reset: sinon.stub(),
            get: getStub
          };
          req.form = {values: {}};
          hofFormWizard.Controller.prototype.getNextStep.returns('/next-page');
        });

        describe('when the condition config is met', () => {

          it('the next step is the fork target', () => {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition: {
                field: 'example-radio',
                value: 'superman'
              }
            }];
            controller.getNextStep(req, {}).should.contain('/target-page');
          });
        });

        describe('when the condition config is not met', () => {
          it('the next step is the original next target', () => {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition: {
                field: 'example-radio',
                value: 'lex luther'
              }
            }];
            controller.getNextStep(req, {}).should.equal('/next-page');
          });
        });

        describe('when the condition is => met', () => {
          it('the next step is the fork target', () => {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.getNextStep(req, {}).should.contain('/target-page');
          });
        });

        describe('when the condition is => not met', () => {

          it('the next step is the origin next target', () => {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'batman';
              }
            }];
            controller.getNextStep(req, {}).should.equal('/next-page');
          });
        });

        describe('when the action is "edit" and we\'ve been down the fork', () => {
          it('should return /confirm if baseUrl is not set', () => {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = false;
            req.params.action = 'edit';
            controller.getNextStep(req).should.equal('/confirm');
          });

          it('should return /a-base-url/confirm if baseUrl is set', () => {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = false;
            req.params.action = 'edit';
            req.baseUrl = '/a-base-url';
            controller.getNextStep(req).should.equal('/a-base-url/confirm');
          });

          it('should append "edit" to the path if baseUrl is set and continueOnEdit is false', () => {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = true;
            req.params.action = 'edit';
            req.baseUrl = '/a-base-url';
            controller.getNextStep(req).should.equal('/a-base-url/target-page/edit');
          });
        });

        describe('when the action is "edit" but we\'ve not been down the fork', () => {
          it('appends "edit" to the path', () => {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = false;
            req.params.action = 'edit';
            controller.getNextStep(req).should.contain('/target-page');
          });
        });

        describe('when the action is "edit" and we\'ve been down the standard path', () => {
          it('appends "edit" to the path', () => {
            getStub.returns(['/next-page']);
            req.form.values['example-radio'] = 'clark-kent';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = false;
            req.params.action = 'edit';
            controller.getNextStep(req).should.contain('/confirm');
          });
        });

        describe('when the action is "edit" but we\'ve not been down the standard path', () => {
          it('appends "edit" to the path', () => {
            req.form.values['example-radio'] = 'clark-kent';
            controller.options.forks = [{
              target: '/target-page',
              condition(request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = false;
            req.params.action = 'edit';
            controller.getNextStep(req).should.contain('/next-page');
          });
        });

      });

      describe('with more than one fork', () => {

        describe('when the fields are the same', () => {

          beforeEach(() => {
            req.form = {values: {
              'example-radio': 'superman'
            }};
            controller.options.forks = [{
              target: '/superman-page',
              condition: {
                field: 'example-radio',
                value: 'superman'
              }
            }, {
              target: '/batman-page',
              condition: {
                field: 'example-radio',
                value: 'superman'
              }
            }];
          });

          describe('and each condition is met', () => {
            it('the last forks\' target becomes the next step', () => {
              controller.getNextStep(req, {}).should.contain('/batman-page');
            });
          });

        });

        describe('when the fields are different', () => {

          beforeEach(() => {
            controller.options.forks = [{
              target: '/superman-page',
              condition: {
                field: 'example-radio',
                value: 'superman'
              }
            }, {
              target: '/smallville-page',
              condition: {
                field: 'example-email',
                value: 'clarke@smallville.com'
              }
            }];
          });

          describe('and each condition is met', () => {
            beforeEach(() => {
              req.form = {values: {
                'example-radio': 'superman',
                'example-email': 'clarke@smallville.com'
              }};
            });
            it('the last forks\' target becomes the next step', () => {
              controller.getNextStep(req, {}).should.contain('/smallville-page');
            });
          });

          describe('and the first condition is met', () => {
            beforeEach(() => {
              req.form = {values: {
                'example-radio': 'superman',
                'example-email': 'kent@smallville.com'
              }};
            });
            it('the first forks\' target becomes the next step', () => {
              controller.getNextStep(req, {}).should.contain('/superman-page');
            });
          });

        });
      });

    });

    describe('.getErrorStep()', () => {
      const req = {};
      const err = {};

      beforeEach(() => {
        hofFormWizard.Controller.prototype.getErrorStep = sinon.stub().returns('/');
        req.params = {};
        controller = new Controller({template: 'foo'});
      });

      describe('when the action is "edit" and the parent redirect is not edit', () => {
        it('appends "edit" to the path', () => {
          req.params.action = 'edit';
          controller.getErrorStep(err, req).should.match(/\/edit$/);
        });

        it('doesn\'t append "edit" to the path if "edit" is already present', () => {
          req.params.action = 'edit';
          hofFormWizard.Controller.prototype.getErrorStep.returns('/a-path/edit/id');
          controller.getErrorStep(err, req).should.not.match(/\/edit$/);
        });
      });

    });

  });

});
