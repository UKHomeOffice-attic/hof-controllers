'use strict';

var proxyquire = require('proxyquire');

describe('lib/base-controller', function () {

  var hmpoFormWizard;
  var Controller;
  var controller;

  beforeEach(function () {
    hmpoFormWizard = require('hmpo-form-wizard');
  });

  describe('constructor', function () {

    beforeEach(function () {
      hmpoFormWizard.Controller = sinon.stub(hmpoFormWizard, 'Controller', function() {
        this.options = {};
      });
      hmpoFormWizard.Controller.prototype.locals = sinon.stub().returns({foo: 'bar'});
      Controller = proxyquire('../../lib/base-controller', {
        'hmpo-form-wizard': hmpoFormWizard
      });
    });

    it('calls the parent constructor', function () {
      controller = new Controller({template: 'foo'});
      hmpoFormWizard.Controller.should.have.been.called;
    });

  });

  describe('methods', function () {

    beforeEach(function () {
      hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub();
      Controller = proxyquire('../../lib/base-controller', {
        'hmpo-form-wizard': hmpoFormWizard
      });
    });

    describe('.locals()', function () {

      var req = {
        params: {}
      };
      var res = {};

      beforeEach(function () {
        controller = new Controller({
          template: 'foo'
        });
      });

      it('always extends from parent locals', function () {
        controller.getErrors = sinon.stub().returns({foo: true});
        controller.locals(req, res).should.have.property('foo').and.always.equal('bar');
      });

      it('returns errorLength.single if there is one error', function () {
        controller.getErrors = sinon.stub().returns({foo: true});
        controller.locals(req, res).should.have.property('errorLength')
          .and.deep.equal({
            single: true
          });
      });

      it('returns errorLength.multiple if there is more than one error', function () {
        controller.getErrors = sinon.stub().returns({bar: true, baz: true});
        controller.locals(req, res).should.have.property('errorLength')
          .and.deep.equal({
            multiple: true
          });
      });

      describe('with locals', function () {
        beforeEach(function () {
          controller.getErrors = sinon.stub().returns({foo: true});
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

        it('should expose test in locals', function () {
          controller.locals(req, res).should.have.property('test').and.equal('bar');
        });
      });
    });

    describe('.getValues()', function () {
      var req = {
        params: {}
      };
      var res = {};
      var callback;

      beforeEach(function () {
        hmpoFormWizard.Controller.prototype.getValues = sinon.stub();
        Controller.prototype.getErrors = sinon.stub();
        req = {
          sessionModel: {
            reset: sinon.stub()
          },
          header: sinon.stub()
        };
        callback = sinon.stub();
      });

      describe('when there\'s a next step', function () {

        beforeEach(function () {
          controller = new Controller({
            template: 'foo'
          });
          controller.options = {
            next: '/somepage'
          };
          controller.getValues(req, res, callback);
        });

        it('resets the session', function () {
          req.sessionModel.reset.should.not.have.been.called;
        });

      });

      describe('when there\'s no next step', function () {

        beforeEach(function () {
          controller = new Controller({template: 'foo'});
          controller.options = {};
          controller.getValues(req, res, callback);
        });

        it('resets the session', function () {
          req.sessionModel.reset.should.have.been.calledOnce;
        });

      });

      describe('when there\'s no next step but clearSession is false', function () {

        beforeEach(function () {
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: false
          };
          controller.getValues(req, res, callback);
        });

        it('resets the session', function () {
          req.sessionModel.reset.should.not.have.been.calledOnce;
        });

      });

      describe('when clearSession is set', function () {

        beforeEach(function () {
          controller = new Controller({template: 'foo'});
          controller.options = {
            clearSession: true
          };
          controller.getValues(req, res, callback);
        });

        it('resets the session', function () {
          req.sessionModel.reset.should.have.been.calledOnce;
        });

      });

      it('always calls the parent controller getValues', function () {
        controller = new Controller({template: 'foo'});
        controller.options = {};
        controller.getValues(req, res, callback);
        hmpoFormWizard.Controller.prototype.getValues
          .should.always.have.been.calledWithExactly(req, res, callback);
      });

    });

    describe('.getNextStep()', function () {
      var req = {};

      beforeEach(function () {
        hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/');
        req.params = {};
        req.baseUrl = '';
        controller = new Controller({template: 'foo'});
        controller.options = {};
      });

      describe('when the action is "edit"', function () {
        it('appends "edit" to the path', function () {
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/edit');
        });
      });

      describe('when the action is "edit" and continueOnEdit option is falsey', function () {
        it('appends "confirm" to the path', function () {
          controller.options.continueOnEdit = false;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/confirm');
        });
      });

      describe('when the action is "edit" and continueOnEdit is truthy', function () {
        it('appends "/edit" to the path if next page is not /confirm', function () {
          hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/step');
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          controller.getNextStep(req).should.contain('/edit');
        });

        it('doesn\'t append "/edit" to the path if next page is /confirm', function () {
          hmpoFormWizard.Controller.prototype.getNextStep = sinon.stub().returns('/confirm');
          controller.options.continueOnEdit = true;
          req.params.action = 'edit';
          controller.getNextStep(req).should.not.contain('/edit');
        });
      });

      describe('with a fork', function () {
        var getStub;

        beforeEach(function () {
          getStub = sinon.stub();
          req.sessionModel = {
            reset: sinon.stub(),
            get: getStub
          };
          req.form = {values: {}};
          hmpoFormWizard.Controller.prototype.getNextStep.returns('/next-page');
        });

        describe('when the condition config is met', function () {

          it('the next step is the fork target', function () {
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

        describe('when the condition config is not met', function () {
          it('the next step is the original next target', function () {
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

        describe('when the condition function is met', function () {
          it('the next step is the fork target', function () {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition: function (request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.getNextStep(req, {}).should.contain('/target-page');
          });
        });

        describe('when the condition function is not met', function () {

          it('the next step is the origin next target', function () {
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition: function (request) {
                return request.form.values['example-radio'] === 'batman';
              }
            }];
            controller.getNextStep(req, {}).should.equal('/next-page');
          });
        });

        describe('when the action is "edit"', function () {
          it('appends "edit" to the path', function () {
            getStub.returns(['/target-page']);
            req.form.values['example-radio'] = 'superman';
            controller.options.forks = [{
              target: '/target-page',
              condition: function (request) {
                return request.form.values['example-radio'] === 'superman';
              }
            }];
            controller.options.continueOnEdit = true;
            req.params.action = 'edit';
            controller.getNextStep(req).should.contain('/edit');
          });
        });

      });

      describe('with more than one fork', function () {

        describe('when the fields are the same', function () {

          beforeEach(function () {
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

          describe('and each condition is met', function () {
            it('the last forks\' target becomes the next step', function () {
              controller.getNextStep(req, {}).should.contain('/batman-page');
            });
          });

        });

        describe('when the fields are different', function () {

          beforeEach(function () {
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

          describe('and each condition is met', function () {
            beforeEach(function () {
              req.form = {values: {
                'example-radio': 'superman',
                'example-email': 'clarke@smallville.com'
              }};
            });
            it('the last forks\' target becomes the next step', function () {
              controller.getNextStep(req, {}).should.contain('/smallville-page');
            });
          });

          describe('and the first condition is met', function () {
            beforeEach(function () {
              req.form = {values: {
                'example-radio': 'superman',
                'example-email': 'kent@smallville.com'
              }};
            });
            it('the first forks\' target becomes the next step', function () {
              controller.getNextStep(req, {}).should.contain('/superman-page');
            });
          });

        });
      });

    });

    describe('.getErrorStep()', function () {
      var req = {};
      var err = {};

      beforeEach(function () {
        hmpoFormWizard.Controller.prototype.getErrorStep = sinon.stub().returns('/');
        req.params = {};
        controller = new Controller({template: 'foo'});
      });

      describe('when the action is "edit" and the parent redirect is not edit', function () {
        it('appends "edit" to the path', function () {
          req.params.action = 'edit';
          controller.getErrorStep(err, req).should.contain('/edit');
        });
      });

    });

  });

});
