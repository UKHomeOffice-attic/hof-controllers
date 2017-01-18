'use strict';

const _ = require('lodash');
const path = require('path');
const proxyquire = require('proxyquire');
const i18nFuture = require('i18n-future');

describe('Confirm Controller', () => {
  class StubController {
    constructor(options) {
      this.options = options;
    }
  }
  class EmailerStub {}
  let ConfirmController;
  let confirmController;
  let helpersStub;

  beforeEach(() => {
    StubController.prototype.locals = sinon.stub().returns({});
    StubController.prototype.get = sinon.stub();
    EmailerStub.prototype.sendEmails = sinon.stub().returns(Promise.resolve());
    /* eslint-disable no-underscore-dangle */
    EmailerStub.prototype._initApp = sinon.stub();
    EmailerStub.prototype._initEmailer = sinon.stub();
    EmailerStub.prototype._includeDate = sinon.stub();
    /* eslint-enable no-underscore-dangle */
  });

  describe('with stubbed helpers', () => {
    beforeEach(() => {
      helpersStub = {
        getStepFromFieldName: sinon.stub(),
        isEmptyValue: sinon.stub(),
        hasOptions: sinon.stub(),
        getValue: sinon.stub(),
        conditionalTranslate: sinon.stub(),
        getTranslation: sinon.stub()
      };
      ConfirmController = proxyquire('../../lib/confirm-controller', {
        './base-controller': StubController,
        './util/helpers': helpersStub,
        'hof-emailer': EmailerStub
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
        'step-2a': {
          fields: [
            'field-2'
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

    it('has a formatData method', () => {
      ConfirmController.prototype.should.haveOwnProperty('formatData');
    });

    it('has a get method', () => {
      ConfirmController.prototype.should.haveOwnProperty('get');
    });

    it('has a locals method', () => {
      ConfirmController.prototype.should.haveOwnProperty('locals');
    });

    it('has a getEmailerConfig method', () => {
      ConfirmController.prototype.should.haveOwnProperty('getEmailerConfig');
    });

    it('has a saveValues method', () => {
      ConfirmController.prototype.should.haveOwnProperty('saveValues');
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
      let req = {
        sessionModel: {}
      };
      let res = {};
      let cb;

      beforeEach(() => {
        req.sessionModel.get = sinon.stub();
        req.sessionModel.set = sinon.stub();
      });

      describe('formatData', () => {
        let result;
        let translate;
        beforeEach(() => {
          const data = {
            'field-1': 'Field 1 Value',
            'field-2': 'Field 2 Value',
            'field-x': 'Field x Value',
            'field-3': 'Field 3 Value',
            'field-4': 'Field 4 Value'
          };
          translate = sinon.stub();
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
          result = confirmController.formatData(data, translate);
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

          it('doesn\'t contain any duplicate fields', () => {
            _.uniq(result.fields).should.be.deep.equal(result.fields);
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

      describe('get', () => {
        const data = {
          a: 'value'
        };

        beforeEach(() => {
          req.sessionModel.toJSON = sinon.stub().returns(data);
          req.translate = {};
          sinon.stub(ConfirmController.prototype, 'formatData');
        });

        afterEach(() => {
          ConfirmController.prototype.formatData.restore();
        });

        it('saves the return value of formatData to the sessionModel', () => {
          const result = {a: 'value'};
          ConfirmController.prototype.formatData.returns(result);
          confirmController.get(req, res, cb);
          req.sessionModel.set.should.have.been.calledOnce
            .and.calledWithExactly('formattedData', result);
        });

        it('calls formatData with the data and translate function', () => {
          confirmController.get(req, res, cb);
          ConfirmController.prototype.formatData.should.have.been.calledOnce
            .and.calledWithExactly(data, req.translate);
        });

        it('calls super', () => {
          confirmController.get(req, res, cb);
          StubController.prototype.get.should.have.been.calledOnce
            .and.calledWithExactly(req, res, cb);
        });
      });

      describe('locals', () => {
        it('calls super', () => {
          confirmController.locals(req, res);
          StubController.prototype.locals.should.have.been.calledOnce
            .and.calledWithExactly(req, res);
        });

        it('extends super.locals with rows', () => {
          req.sessionModel.get.withArgs('formattedData').returns([{a: 'value'}, {b: 'another value'}]);
          StubController.prototype.locals.returns({root: 'value'});
          confirmController.locals(req, res).should.be.deep.equal({
            root: 'value',
            rows: [{
              a: 'value'
            }, {
              b: 'another value'
            }]
          });
        });
      });

      describe('getEmailerConfig', () => {
        beforeEach(() => {
          req.sessionModel.get = sinon.stub().returns('sterling@archer.com');
          req.rawTranslate = sinon.stub();
          confirmController.options = {
            emailConfig: {
              port: ''
            }
          };
          req.sessionModel.get.withArgs('formattedData').returns({
            a: 'value'
          });
          helpersStub.conditionalTranslate
            .onCall(0).returns('subject')
            .onCall(1).returns('customer-intro')
            .onCall(2).returns('caseworker-intro')
            .onCall(3).returns('customer-outro')
            .onCall(4).returns('caseworker-outro');
        });

        it('extends the config from step with translated values', () => {
          confirmController.getEmailerConfig(req).should.be.deep.equal({
            port: '',
            data: {
              a: 'value'
            },
            subject: 'subject',
            customerIntro: 'customer-intro',
            caseworkerIntro: 'caseworker-intro',
            customerOutro: 'customer-outro',
            caseworkerOutro: 'caseworker-outro',
            customerEmail: 'sterling@archer.com'
          });
        });

        it('passes rawTranslate when translating subject', () => {
          confirmController.getEmailerConfig(req);
          helpersStub.conditionalTranslate.firstCall.should.have.been.calledWith(req.rawTranslate);
        });

        it('doesn\'t include customerEmail if emailUser is false', () => {
          confirmController.options.emailUser = false;
          confirmController.getEmailerConfig(req).should.not.have.property('customerEmail');
        });
      });

      describe('saveValues', () => {
        beforeEach(() => {
          cb = sinon.stub();
          sinon.stub(ConfirmController.prototype, 'getEmailerConfig');
        });

        afterEach(() => {
          ConfirmController.prototype.getEmailerConfig.restore();
        });

        it('calls getEmailerConfig with request object', () => {
          confirmController.saveValues(req, res, cb);
          ConfirmController.prototype.getEmailerConfig.should.have.been.calledOnce
            .and.calledWithExactly(req);
        });

        it('calls emailer.sendEmails', () => {
          confirmController.saveValues(req, res, cb);
          EmailerStub.prototype.sendEmails.should.have.been.calledOnce
            .and.calledWithExactly();
        });

        it('calls callback with no args on success', done => {
          confirmController.saveValues(req, res, err => {
            chai.expect(err).to.be.undefined;
            done();
          });
        });

        it('calls callback with err on error', done => {
          const error = new Error('oops');
          EmailerStub.prototype.sendEmails.returns(Promise.reject(error));
          confirmController.saveValues(req, res, err => {
            err.should.be.equal(error);
            done();
          });
        });
      });
    });
  });

  describe('without stubbed helpers', () => {
    let translate;
    beforeEach(done => {
      const i18n = i18nFuture({
        path: `${path.resolve(__dirname, '../fixtures/translations/')}/__lng__/__ns__.json`
      }).on('ready', () => {
        translate = i18n.translate.bind(i18n);
        done();
      });
      ConfirmController = proxyquire('../../lib/confirm-controller', {
        './base-controller': StubController,
        'hof-emailer': EmailerStub
      });
      confirmController = new ConfirmController({
        steps: require('../fixtures/steps'),
        fieldsConfig: require('../fixtures/fields')
      });
    });

    describe('formatData', () => {
      it('contains data formatted correctly', () => {
        confirmController.formatData(require('../fixtures/data'), translate)
          .should.be.deep.equal(require('../fixtures/output'));
      });
    });
  });
});
