'use strict';

const proxyquire = require('proxyquire');

const Controller = sinon.stub();
Controller.prototype = {};

const StartController = proxyquire('../../lib/start-controller', {
  './base-controller': Controller
});

describe('lib/start-controller', () => {

  describe('.getValues()', () => {

    let controller;
    let req;
    let res;
    let callback;

    beforeEach(() => {
      req = {
        params: {},
        form: {
          values: {
          }
        },
        sessionModel: {
          set: sinon.stub(),
          get: sinon.stub(),
          unset: sinon.stub()
        }
      };
      res = {};
      callback = sinon.stub();
      req.sessionModel.reset = sinon.stub();
      Controller.prototype.successHandler = sinon.stub();
      controller = new StartController({template: 'index'});
    });

    it('resets the session', () => {
      controller.getValues(req, res, callback);

      req.sessionModel.reset.should.have.been.calledOnce;
    });

    it('successfully handles the request', () => {
      controller.getValues(req, res, callback);

      Controller.prototype.successHandler.should.have.been.calledWithExactly(req, res, callback);
    });

  });

});
