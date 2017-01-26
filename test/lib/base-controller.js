'use strict';

const _ = require('lodash');
const response = require('reqres').res;
const request = require('reqres').req;
const proxyquire = require('proxyquire');

let FormController = require('../../lib/form-controller');

describe('lib/base-controller', () => {

  let Controller;
  let controller;

  beforeEach(() => {
    Controller = proxyquire('../../lib/base-controller', {
      './middleware/mixins': {}
    });
    sinon.stub(FormController.prototype, 'use');
    sinon.stub(FormController.prototype, 'locals').returns({foo: 'bar'});
  });

  afterEach(() => {
    FormController.prototype.use.restore();
    FormController.prototype.locals.restore();
  });

  describe('constructor', () => {

    beforeEach(() => {
      FormController = sinon.spy(FormController);
    });

    it('calls the parent constructor', () => {
      const stub = sinon.stub();
      Controller = proxyquire('../../lib/base-controller', {
        './form-controller': stub,
        './middleware/mixins': {}
      });
      controller = new Controller({
        template: 'foo'
      });
      stub.should.have.been.calledWithExactly({template: 'foo'});
    });

  });

  describe('methods', () => {

    beforeEach(() => {
      sinon.stub(FormController.prototype, 'getNextStep');
    });

    afterEach(() => {
      FormController.prototype.getNextStep.restore();
    });

    describe('.get()', () => {
      const req = {};

      let res;

      beforeEach(() => {
        sinon.stub(FormController.prototype, 'get');
        controller = new Controller({
          template: 'foo'
        });
        res = response({
          locals: {
            partials: {
              step: 'default-template'
            }
          }
        });
      });

      afterEach(() => {
        FormController.prototype.get.restore();
      });

      it('calls super', () => {
        controller.get(req, res, _.noop);
        FormController.prototype.get.should.have.been.calledOnce
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
        translate: () => '',
        params: {}
      };
      const res = response();

      beforeEach((done) => {
        sinon.stub(Controller.prototype, 'getBackLink');
        sinon.stub(Controller.prototype, 'getErrorLength');
        Controller.prototype.getErrorLength.returns({single: true});
        controller = new Controller({
          template: 'foo',
          route: '/bar'
        });
        controller._configure(req, res, done);
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
          req.form.options.fields = {
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

          req.form.options = {
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
        sinon.stub(FormController.prototype, 'getValues').yields();
        Controller.prototype.getErrorLength = sinon.stub();
        req = {
          sessionModel: {
            reset: sinon.stub()
          },
          header: sinon.stub()
        };
        callback = sinon.stub();
      });

      afterEach(() => {
        FormController.prototype.getValues.restore();
      });

      describe('when there\'s a next step', () => {

        beforeEach((done) => {
          controller = new Controller({
            template: 'foo'
          });
          controller.options = {
            next: '/somepage'
          };
          controller._configure(req, res, done);
        });

        it('resets the session', () => {
          controller.getValues(req, res, callback);
          req.sessionModel.reset.should.not.have.been.called;
        });

      });

      describe('when there\'s no next step', () => {

        beforeEach((done) => {
          controller = new Controller({template: 'foo'});
          controller.options = {};
          controller._configure(req, res, done);
        });

        it('resets the session', () => {
          controller.getValues(req, res, callback);
          req.sessionModel.reset.should.have.been.calledOnce;
        });

      });

      describe('when there\'s no next step but clearSession is false', () => {

        beforeEach((done) => {
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: false
          };
          controller._configure(req, res, done);
        });

        it('resets the session', () => {
          controller.getValues(req, res, callback);
          req.sessionModel.reset.should.not.have.been.calledOnce;
        });

      });

      describe('when clearSession is set', () => {

        beforeEach((done) => {
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: true
          };
          controller._configure(req, res, done);
        });

        it('resets the session', () => {
          controller.getValues(req, res, callback);
          req.sessionModel.reset.should.have.been.calledOnce;
        });

        it('resets the session before callback is called', () => {
          controller.getValues(req, res, callback);
          req.sessionModel.reset.should.have.been.calledBefore(callback);
        });

      });

      describe('when parent controller getValues errors', () => {

        let error;

        beforeEach((done) => {
          error = 'Parent getValues error.';
          FormController.prototype.getValues.yields(error);
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: true
          };
          controller._configure(req, res, done);
        });

        it('immediately fires the callback with the error', () => {
          controller.getValues(req, res, callback);
          callback.should.have.been.calledWith(error);
          req.sessionModel.reset.should.not.have.been.called;
        });

      });

      it('always calls the parent controller getValues', () => {
        controller = new Controller({template: 'foo'});
        controller.options = {};
        controller._configure(req, res, () => {});
        controller.getValues(req, res, callback);
        FormController.prototype.getValues
          .should.always.have.been.calledWith(req, res);
      });

    });

    describe('.getNextStep()', () => {
      let req;
      let res;
      let getStub;

      beforeEach((done) => {
        getStub = sinon.stub();
        getStub.returns(['/']);
        req = request();
        res = response();
        req.sessionModel = {
          reset: sinon.stub(),
          get: getStub
        };
        controller = new Controller({template: 'foo'});
        FormController.prototype.getNextStep.returns('/');
        controller._configure(req, res, done);
      });

      describe('when the action is "edit"', () => {
        it('appends "edit" to the path', () => {
          req.form.options.continueOnEdit = true;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/edit');
        });
      });

      describe('when the action is "edit" and continueOnEdit option is falsey', () => {
        it('appends "confirm" to the path', () => {
          req.form.options.continueOnEdit = false;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/confirm');
        });
      });

      describe('when the action is "edit" and continueOnEdit is truthy', () => {
        it('appends "/edit" to the path if next page is not /confirm', () => {
          FormController.prototype.getNextStep.returns('/step');
          req.form.options.continueOnEdit = true;
          req.params.action = 'edit';
          getStub.returns(['/step']);
          controller.getNextStep(req).should.contain('/edit');
        });

        it('doesn\'t append "/edit" to the path if next page is /confirm', () => {
          FormController.prototype.getNextStep.returns('/confirm');
          req.form.options.continueOnEdit = true;
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
          req.form.values = {};
          FormController.prototype.getNextStep.returns('/next-page');
        });

        describe('when the condition config is met', () => {

          it('the next step is the fork target', () => {
            req.form.values['example-radio'] = 'superman';
            req.form.options.forks = [{
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
            req.form.options.forks = [{
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
            req.form.options.forks = [{
              target: '/target-page',
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
              }
            }];
            controller.getNextStep(req, {}).should.contain('/target-page');
          });
        });

        describe('when the condition is => not met', () => {

          it('the next step is the origin next target', () => {
            req.form.values['example-radio'] = 'superman';
            req.form.options.forks = [{
              target: '/target-page',
              condition(r) {
                return r.form.values['example-radio'] === 'batman';
              }
            }];
            controller.getNextStep(req, {}).should.equal('/next-page');
          });
        });

        describe('when the action is "edit" and we\'ve been down the fork', () => {
          it('should return /confirm if baseUrl is not set', () => {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            req.form.options.forks = [{
              target: '/target-page',
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
              }
            }];
            req.form.options.continueOnEdit = false;
            req.params.action = 'edit';
            controller.getNextStep(req).should.equal('/confirm');
          });

          it('should return /a-base-url/confirm if baseUrl is set', () => {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            req.form.options.forks = [{
              target: '/target-page',
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
              }
            }];
            req.form.options.continueOnEdit = false;
            req.params.action = 'edit';
            req.baseUrl = '/a-base-url';
            controller.getNextStep(req).should.equal('/a-base-url/confirm');
          });

          it('should append "edit" to the path if baseUrl is set and continueOnEdit is false', () => {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            req.form.options.forks = [{
              target: '/target-page',
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
              }
            }];
            req.form.options.continueOnEdit = true;
            req.params.action = 'edit';
            req.baseUrl = '/a-base-url';
            controller.getNextStep(req).should.equal('/a-base-url/target-page/edit');
          });
        });

        describe('when the action is "edit" but we\'ve not been down the fork', () => {
          it('appends "edit" to the path', () => {
            req.form.values['example-radio'] = 'superman';
            req.form.options.forks = [{
              target: '/target-page',
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
              }
            }];
            req.form.options.continueOnEdit = false;
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
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
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
              condition(r) {
                return r.form.values['example-radio'] === 'superman';
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
            req.form.values = {
              'example-radio': 'superman'
            };
            req.form.options.forks = [{
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
            req.form.options.forks = [{
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
              req.form.values = {
                'example-radio': 'superman',
                'example-email': 'clarke@smallville.com'
              };
            });
            it('the last forks\' target becomes the next step', () => {
              controller.getNextStep(req, {}).should.contain('/smallville-page');
            });
          });

          describe('and the first condition is met', () => {
            beforeEach(() => {
              req.form.values = {
                'example-radio': 'superman',
                'example-email': 'kent@smallville.com'
              };
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
      const res = {};
      const err = {};

      beforeEach((done) => {
        sinon.stub(FormController.prototype, 'getErrorStep').returns('/');
        req.params = {};
        controller = new Controller({template: 'foo'});
        controller._configure(req, res, done);
      });

      afterEach(() => {
        FormController.prototype.getErrorStep.restore();
      });

      describe('when the action is "edit" and the parent redirect is not edit', () => {
        it('appends "edit" to the path', () => {
          req.params.action = 'edit';
          controller.getErrorStep(err, req).should.match(/\/edit$/);
        });

        it('doesn\'t append "edit" to the path if "edit" is already present', () => {
          req.params.action = 'edit';
          FormController.prototype.getErrorStep.returns('/a-path/edit/id');
          controller.getErrorStep(err, req).should.not.match(/\/edit$/);
        });
      });

    });

  });

});
