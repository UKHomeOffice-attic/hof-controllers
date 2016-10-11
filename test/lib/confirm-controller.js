'use strict';

const proxyquire = require('proxyquire');

const Controller = sinon.stub();
Controller.prototype = {};

const ConfirmController = proxyquire('../../lib/confirm-controller', {
  './base-controller': Controller
});

describe('lib/confirm-controller', () => {
  const req = {
    params: {},
    translate: function () {}
  };
  const res = {};
  let controller;

  const modifierSpy = sinon.spy((value) => value * 3);

  beforeEach(() => {
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
        }],
        modifiers: {
          'field-two': modifierSpy
        }
      }
    };
  });

  describe('tableSections', () => {
    let locals;

    beforeEach(() => {
      locals = controller.locals(req, res);
    });

    it('should have exposed a tableSections array', () => {
      locals.should.have.property('tableSections').and.be.an.instanceOf(Array);
    });

    it('should have 1 section', () => {
      locals.tableSections.length.should.be.equal(1);
    });

    it('should have a fields array', () => {
      locals.tableSections[0].should.have.property('fields').and.be.an.instanceOf(Array);
    });

    describe('fields', () => {
      let fields;

      beforeEach(() => {
        fields = locals.tableSections[0].fields;
      });

      it('should have 4 items', () => {
        fields.length.should.be.equal(4);
      });

      it('should contain objects', () => {
        fields[0].should.be.an.instanceOf(Object);
        fields[1].should.be.an.instanceOf(Object);
        fields[2].should.be.an.instanceOf(Object);
        fields[3].should.be.an.instanceOf(Object);
      });

      it('should have set value: 1 on the field object', () => {
        fields[0].should.have.property('value').and.equal(1);
      });

      it('should have set step: /one on the field object', () => {
        fields[0].should.have.property('step').and.equal('/one');
      });

      it('should use modifiers', () => {
        fields[1].should.have.property('value').and.equal(6);
      });

      it('passes raw value', () => {
        fields[1].should.have.property('rawValue').and.equal(2);
      });

      it('should call modifiers with the value of the field and the request', () => {
        modifierSpy.should.have.been.calledWith(res.locals.values['field-two'], req);
      });

      it('should have set value 3 on the 3rd field object', () => {
        fields[2].should.have.property('value').and.equal(3);
      });

      it('should have set step: /two on the 3rd field object', () => {
        fields[3].should.have.property('step').and.equal('/two');
      });
    });
  });
});
