'use strict';

var stepProgress = require('../../../lib/middleware/step-progress');
var SessionModel = require('../../mocks/session-model');

describe('middleware/step-progress', function () {
  var firstStep = '/one';
  var mock = sinon.stub();
  var middleware;
  var req;
  var res;
  var steps;
  var stepData;

  describe('stepData', function () {
    beforeEach(function () {
      req = {
        url: '/one',
        sessionModel: new SessionModel()
      };
      res = {};
      steps = {
        '/one': {next: '/two'},
        '/two': {next: '/three'},
        '/three': {next: '/four'},
        '/four': {next: '/five'},
        '/five': {},
        '/forkOne': {next: '/two'},
        '/forkTwo': {next: '/four'},
      };
      middleware = stepProgress({
        steps: steps,
        firstStep: firstStep
      });
    });

    it('should set stepData on sessionModel', function () {
      middleware(req, res, function () {
        req.sessionModel.get('stepData').should.be.an.instanceOf(Object);
      });
    });

    describe('First Step', function () {
      beforeEach(function (done) {
        middleware(req, res, function () {
          stepData = req.sessionModel.get('stepData');
          done();
        });
      });

      it('should have set the stepNumber to 1', function () {
        stepData.stepNumber.should.be.equal(1);
      });

      it('should have set the totalSteps to 5', function () {
        stepData.totalSteps.should.be.equal(5);
      });

      it('should have set the prevStep to \'/one\'', function () {
        stepData.prevStep.should.be.equal('/one');
      });

      it('should have set the stepsJourney to [\'/one\']', function () {
        stepData.stepsJourney.should.be.eql(['/one']);
      });
    });

    describe('Second Step', function () {
      beforeEach(function (done) {
        req.url = '/one';
        middleware(req, res, mock);
        req.url = '/two';
        middleware(req, res, function () {
          stepData = req.sessionModel.get('stepData');
          done();
        });
      });

      it('should have set the currentStepNumber to 2', function () {
        stepData.stepNumber.should.be.equal(2);
      });

      it('should have set the totalSteps to 5', function () {
        stepData.totalSteps.should.be.equal(5);
      });

      it('should have set prevStep to /two', function () {
        stepData.prevStep.should.be.equal('/two');
      });

      it('should have set the stepsJourney to [\'/one\', \'/two\']', function () {
        stepData.stepsJourney.should.be.eql(['/one', '/two']);
      });
    });

    describe('Third Step', function () {
      beforeEach(function (done) {
        req.url = '/one';
        middleware(req, res, mock);
        req.url = '/two';
        middleware(req, res, mock);
        req.url = '/three';
        middleware(req, res, function () {
          stepData = req.sessionModel.get('stepData');
          done();
        });
      });

      it('should have set the currentStepNumber to 3', function () {
        stepData.stepNumber.should.be.equal(3);
      });

      it('should have set the totalSteps to 5', function () {
        stepData.totalSteps.should.be.equal(5);
      });

      it('should have set prevStep to /three', function () {
        stepData.prevStep.should.be.equal('/three');
      });

      it('should have set the stepsJourney to [\'/one\', \'/two\', \'/three\']', function () {
        stepData.stepsJourney.should.be.eql(['/one', '/two', '/three']);
      });
    });

    describe('Forks', function () {
      describe('Adding to totalSteps', function () {
        beforeEach(function (done) {
          req.url = '/one';
          middleware(req, res, mock);
          req.url = '/forkOne';
          middleware(req, res, function () {
            stepData = req.sessionModel.get('stepData');
            done();
          });
        });

        it('should have set the currentStepNumber to 2', function () {
          stepData.stepNumber.should.be.equal(2);
        });

        it('should have set the totalSteps to 6', function () {
          stepData.totalSteps.should.be.equal(6);
        });

        it('should have set prevStep to /forkOne', function () {
          stepData.prevStep.should.be.equal('/forkOne');
        });

        it('should have set stepsJourney to [\'/one\', \'/forkOne\']', function () {
          stepData.stepsJourney.should.be.eql(['/one', '/forkOne']);
        });
      });

      describe('Skipping steps', function () {
        beforeEach(function (done) {
          req.url = '/one';
          middleware(req, res, function () {});
          req.url = '/forkTwo';
          middleware(req, res, function () {
            stepData = req.sessionModel.get('stepData');
            done();
          });
        });

        it('should have set currentStepNumber to 2', function () {
          stepData.stepNumber.should.be.equal(2);
        });

        it('should have set the totalSteps to 4', function () {
          stepData.totalSteps.should.be.equal(4);
        });

        it('should have set prevStep to /forkTwo', function () {
          stepData.prevStep.should.be.equal('/forkTwo');
        });

        it('should have set stepsJourney to [\'/one\', \'/forkTwo\']', function () {
          stepData.stepsJourney.should.be.eql(['/one', '/forkTwo']);
        });
      });

      describe('Complex journey', function () {
        beforeEach(function (done) {
          req.url = '/one';
          middleware(req, res, mock);
          req.url = '/two';
          middleware(req, res, mock);
          req.url = '/three';
          middleware(req, res, mock);
          req.url = '/two';
          middleware(req, res, mock);
          req.url = '/one';
          middleware(req, res, mock);
          req.url = '/forkOne';
          middleware(req, res, mock);
          req.url = '/two';
          middleware(req, res, mock);
          req.url = '/forkTwo';
          middleware(req, res, function () {
            stepData = req.sessionModel.get('stepData');
            done();
          });
        });

        it('should have set currentStepNumber to 4', function () {
          stepData.stepNumber.should.be.equal(4);
        });

        it('should have set the totalSteps to 6', function () {
          stepData.totalSteps.should.be.equal(6);
        });

        it('should have set prevStep to /forkTwo', function () {
          stepData.prevStep.should.be.equal('/forkTwo');
        });

        it('should have set stepsJourney to [\'/one\', \'/forkOne\', \'/two\', \'/forkTwo\', \'/three\']', function () {
          stepData.stepsJourney.should.be.eql(['/one', '/forkOne', '/two', '/forkTwo', '/three']);
        });
      });
    });
  });

});
