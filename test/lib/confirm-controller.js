'use strict';

const path = require('path');
const proxyquire = require('proxyquire');
const i18nFuture = require('i18n-future');

describe('Confirm Controller', () => {
  class StubController {
    constructor(options) {
      this.options = options;
    }
  }
  let ConfirmController;
  let confirmController;
  let helpersStub;
  let req = {};
  let res = {};

  beforeEach(() => {
    StubController.prototype.locals = sinon.stub().returns({});
  });

  describe('with stubbed helpers', () => {
    beforeEach(() => {
      helpersStub = {
        getStepFromFieldName: sinon.stub(),
        isEmptyValue: sinon.stub(),
        hasOptions: sinon.stub(),
        getValue: sinon.stub(),
        getTranslation: sinon.stub()
      };
      ConfirmController = proxyquire('../../lib/confirm-controller', {
        './base-controller': StubController,
        './util/helpers': helpersStub
      });
      const steps = {
        'step-1': {
          fields: [
            'field-1'
          ],
          locals: {
            section: 'section-1'
          }
        },
        'step-2': {
          fields: [
            'field-2',
            'field-x'
          ],
          locals: {
            section: 'section-1'
          }
        },
        'step-3': {
          fields: [
            'field-3',
            'field-4'
          ],
          locals: {
            section: 'section-2'
          }
        },
        'step-4': {
          fields: [
            'field-5',
            'field-6'
          ],
          locals: {
            section: 'section-2'
          }
        }
      };
      const fieldsConfig = {
        'field-1': {},
        'field-2': {},
        'field-x': {},
        'field-3': {},
        'field-4': {
          includeInSummary: false
        }
      };
      confirmController = new ConfirmController({
        steps,
        fieldsConfig,
      });
    });

    it('has an options object', () => {
      confirmController.should.haveOwnProperty('options');
    });

    it('has a locals method', () => {
      ConfirmController.prototype.should.haveOwnProperty('locals');
    });

    describe('options object', () => {
      it('has a steps object', () => {
        confirmController.options.should.haveOwnProperty('steps');
      });

      it('has a fieldsConfig object', () => {
        confirmController.options.should.haveOwnProperty('fieldsConfig');
      });
    });

    describe('public methods', () => {
      describe('locals', () => {
        let result;
        beforeEach(() => {
          const data = {
            'field-1': 'Field 1 Value',
            'field-2': 'Field 2 Value',
            'field-x': 'Field x Value',
            'field-3': 'Field 3 Value',
            'field-4': 'Field 4 Value'
          };
          req.translate = sinon.stub();
          req.sessionModel = {
            toJSON: sinon.stub().returns(data)
          };
          helpersStub.getTranslation
            .onCall(0).returns('Section 1')
            .onCall(1).returns('Field One')
            .onCall(2).returns('Field Two')
            .onCall(3).returns('Field X')
            .onCall(4).returns('Section 2')
            .onCall(5).returns('Field 3');
          helpersStub.getStepFromFieldName
            .onCall(0).returns('step-1')
            .onCall(1).returns('step-2')
            .onCall(2).returns('step-2')
            .onCall(3).returns('step-3');
          helpersStub.isEmptyValue.returns(false)
            .withArgs(undefined).returns(true);
          result = confirmController.locals(req, res).tableSections;
        });

        it('is an array with 2 items', () => {
          result.should.be.an('array')
            .and.have.property('length')
            .and.be.equal(2);
        });

        describe('first section', () => {
          beforeEach(() => {
            result = result[0];
          });

          it('has a section property set to Section 1', () => {
            result.should.have.property('section')
              .and.be.equal('Section 1');
          });

          it('has 3 fields', () => {
            result.should.have.property('fields')
              .and.have.property('length')
              .and.be.equal(3);
          });

          describe('fields', () => {
            beforeEach(() => {
              result = result.fields;
            });

            it('should contain the correct fields', () => {
              result.should.deep.equal([{
                field: 'field-1',
                label: 'Field One',
                step: 'step-1',
                value: 'Field 1 Value'
              }, {
                field: 'field-2',
                label: 'Field Two',
                step: 'step-2',
                value: 'Field 2 Value'
              }, {
                field: 'field-x',
                label: 'Field X',
                step: 'step-2',
                value: 'Field x Value'
              }]);
            });
          });
        });

        describe('second section', () => {
          beforeEach(() => {
            result = result[1];
          });

          it('has a section property set to Section 2', () => {
            result.should.have.property('section')
              .and.be.equal('Section 2');
          });

          it('has 1 field', () => {
            result.should.have.property('fields')
              .and.have.property('length')
              .and.be.equal(1);
          });

          describe('fields', () => {
            beforeEach(() => {
              result = result.fields;
            });

            it('should contain the correct fields', () => {
              result.should.deep.equal([{
                field: 'field-3',
                label: 'Field 3',
                step: 'step-3',
                value: 'Field 3 Value'
              }]);
            });
          });
        });
      });
    });
  });

  describe('without stubbed helpers', () => {
    beforeEach(done => {
      const i18n = i18nFuture({
        path: `${path.resolve(__dirname, '../fixtures/translations/')}/__lng__/__ns__.json`
      }).on('ready', () => {
        req.translate = i18n.translate.bind(i18n);
        done();
      });
      ConfirmController = proxyquire('../../lib/confirm-controller', {
        './base-controller': StubController
      });
      confirmController = new ConfirmController({
        steps: require('../fixtures/steps'),
        fieldsConfig: require('../fixtures/fields')
      });
      req.sessionModel = {
        toJSON: sinon.stub().returns(require('../fixtures/data'))
      };
    });

    it('contains data formatted correctly', () => {
      confirmController.locals(req, res).tableSections
        .should.be.deep.equal(require('../fixtures/output'));
    });
  });
});
