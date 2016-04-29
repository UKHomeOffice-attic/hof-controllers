'use strict';

var proxyquire = require('proxyquire');

var Controller = sinon.stub();
Controller.prototype = {};

var ConfirmController = proxyquire('../../lib/confirm-controller', {
  './base-controller': Controller
});

describe('lib/confirm-controller', function () {
  var req = {
    params: {},
    sessionModel: {
      get: sinon.stub().returns({
        stepNumber: 0,
        totalSteps: 0
      })
    }
  };
  var res = {};
  var controller;

  beforeEach(function () {
    controller = new ConfirmController({
      template: 'foo'
    });
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
      config: {
        tableSections: [{
          name: 'test',
          fields: [
            'field-one',
            'field-two',
            'field-three',
            'field-four'
          ]
        }]
      }
    };
  });

  describe('tableSections', function () {
    var locals;

    beforeEach(function() {
      locals = controller.locals(req, res);
    });

    it('should have exposed a tableSections array', function () {
      locals.should.have.property('tableSections').and.be.an.instanceOf(Array);
    });

    it('should have 1 section', function () {
      locals.tableSections.length.should.be.equal(1);
    });

    it('should have a fields array', function () {
      locals.tableSections[0].should.have.property('fields').and.be.an.instanceOf(Array);
    });

    describe('fields', function () {
      var fields;

      beforeEach(function () {
        fields = locals.tableSections[0].fields;
      });

      it('should have 4 items', function () {
        fields.length.should.be.equal(4);
      });

      it('should contain objects', function () {
        fields[0].should.be.an.instanceOf(Object);
        fields[1].should.be.an.instanceOf(Object);
        fields[2].should.be.an.instanceOf(Object);
        fields[3].should.be.an.instanceOf(Object);
      });

      it('should have set value: 1 on the field object', function () {
        fields[0].should.have.property('value').and.equal(1);
      });

      it('should have set step: /one on the field object', function () {
        fields[0].should.have.property('step').and.equal('/one');
      });

      it('should have set value 3 on the 3rd field object', function () {
        fields[2].should.have.property('value').and.equal(3);
      });

      it('should have set step: /two on the 3rd field object', function () {
        fields[3].should.have.property('step').and.equal('/two');
      });
    });
  });
});
