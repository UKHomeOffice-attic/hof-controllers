'use strict';

const _ = require('lodash');
const proxyquire = require('proxyquire');

describe('lib/base-controller', () => {

  let hmpoFormWizard;
  let Controller;
  let controller;

  beforeEach(() => {
    hmpoFormWizard = require('hmpo-form-wizard');
  });

  describe('constructor', () => {

    beforeEach(() => {
      hmpoFormWizard.Controller = sinon.stub(hmpoFormWizard, 'Controller', function () {
        this.options = {};
      });
      hmpoFormWizard.Controller.prototype.locals = sinon.stub().returns({foo: 'bar'});
      Controller = proxyquire('../../lib/base-controller', {
        'hmpo-form-wizard': hmpoFormWizard,
        './middleware/mixins': {}
      });
    });

    it('calls the parent constructor', () => {
      controller = new Controller({template: 'foo'});
      hmpoFormWizard.Controller.should.have.been.called;
    });

  });

  describe('methods', () => {

    beforeEach(() => {
      hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub();
      Controller = proxyquire('../../lib/base-controller', {
        'hmpo-form-wizard': hmpoFormWizard
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
        hmpoFormWizard.Controller.prototype.get = sinon.stub();
        controller = new Controller({
          template: 'foo'
        });
      });

      it('calls super', () => {
        controller.get(req, res, _.noop);
        hmpoFormWizard.Controller.prototype.get.should.have.been.calledOnce
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

    describe('.locals()', () => {

      const req = {
        params: {}
      };
      const res = {};

      beforeEach(() => {
        sinon.stub(Controller.prototype, 'getBackLink');
        sinon.stub(Controller.prototype, 'getErrorLength');
        Controller.prototype.getErrorLength.returns({single: true});
        controller = new Controller({
          template: 'foo'
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
            }
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
        hmpoFormWizard.Controller.prototype.getValues = sinon.stub();
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

      });

      it('always calls the parent controller getValues', () => {
        controller = new Controller({template: 'foo'});
        controller.options = {};
        controller.getValues(req, res, callback);
        hmpoFormWizard.Controller.prototype.getValues
          .should.always.have.been.calledWithExactly(req, res, callback);
      });

    });

    describe('.getNextStep()', () => {
      const req = {};
      let getStub;

      beforeEach(() => {
        getStub = sinon.stub();
        getStub.returns(['/']);
        hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/');
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
          hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/step');
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          getStub.returns(['/step']);
          controller.getNextStep(req).should.contain('/edit');
        });

        it('doesn\'t append "/edit" to the path if next page is /confirm', () => {
          hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/confirm');
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
          hmpoFormWizard.Controller.prototype.getNextStep.returns('/next-page');
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
        hmpoFormWizard.Controller.prototype.getErrorStep = sinon.stub().returns('/');
        req.params = {};
        controller = new Controller({template: 'foo'});
      });

      describe('when the action is "edit" and the parent redirect is not edit', () => {
        it('appends "edit" to the path', () => {
          req.params.action = 'edit';
          controller.getErrorStep(err, req).should.contain('/edit');
        });
      });

    });

  });

});
