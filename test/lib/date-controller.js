'use strict';

const proxyquire = require('proxyquire');
const moment = require('moment');

const Controller = sinon.stub();
Controller.prototype = {};
Controller.prototype.validateField = sinon.stub();

const DateController = proxyquire('../../lib/date-controller', {
  './base-controller': Controller
});

const ErrorClass = require('../../lib/error');

describe('lib/date-controller', () => {

  let controller;
  const args = {template: 'index'};

  beforeEach(() => {
    controller = new DateController(args);
    controller.dateKey = 'date';
    controller.options = {};
    controller.options.fields = {
     'date': {}
    };
  });

  describe('instantiated', () => {
    it('calls Controller with the arguments', () => {
      Controller.should.have.been.called;
    });
  });

  describe('validateField(keyToValidate, req)', () => {

    const req = {
      form: {
        values: {}
      }
    };

    describe('validation', () => {

      describe('required error', () => {

        it('returns an error class when the field is undefined', () => {
          req.form.values.date = undefined;
          const undefinedCheck = controller.validateField('date', req);

          undefinedCheck.should.be.an.instanceof(ErrorClass);
          undefinedCheck.should.have.property('key').and.equal('date');
          undefinedCheck.should.have.property('type').and.equal('required');
        });

        it('returns an error class when the field is an empty string', () => {
          req.form.values.date = '';
          const emptyStringCheck = controller.validateField('date', req);

          emptyStringCheck.should.be.an.instanceof(ErrorClass);
          emptyStringCheck.should.have.property('key').and.equal('date');
          emptyStringCheck.should.have.property('type').and.equal('required');
        });

      });

      describe('numeric error', () => {

        it('returns an error class when the field is not numeric', () => {
          req.form.values.date = 'ab-cd-efgh';
          const numericCheck = controller.validateField('date', req);

          numericCheck.should.be.an.instanceof(ErrorClass);
          numericCheck.should.have.property('key').and.equal('date');
          numericCheck.should.have.property('type').and.equal('numeric');
        });

      });

      describe('format error', () => {

        it('returns an error class when the field is incorrectly formatted', () => {
          req.form.values.date = '01-13-1982';
          const formatCheck = controller.validateField('date', req);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('format');
        });

      });

      describe('future error', () => {

        it('returns an error class when the field is in the future', () => {
          req.form.values.date = moment().add(1, 'day').format('DD-MM-YYYY');
          const formatCheck = controller.validateField('date', req);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('future');
        });

      });

      describe('can be overridden', () => {

        it('does not return an error for non-numeric values if numeric is not specficied as a validator', () => {
          controller.options.fields.date.validate = ['required', 'format', 'future'];
          req.form.values.date = 'ab-cd-efgh';

          const error = controller.validateField('date', req);
          error.should.have.property('type').and.not.equal('numeric');
        });

        it('does not return an error if validate property is empty', () => {
          controller.options.fields.date.validate = [];
          req.form.values.date = 'ab-cd-efgh';

          const error = controller.validateField('date', req);
          should.equal(error, undefined);
        });

      });

    });

    describe('when the date is not required', () => {

      describe('required error', () => {

        it('does not return an error when the field is undefined', () => {
          req.form.values.date = undefined;

          should.equal(controller.validateField('date', req, false), undefined);
        });

        it('does not return an error when the field is an empty string', () => {
          req.form.values.date = '';

          should.equal(controller.validateField('date', req, false), undefined);
        });

      });

      describe('numeric error', () => {

        it('returns an error class when the field is not numeric', () => {
          req.form.values.date = 'ab-cd-efgh';
          const numericCheck = controller.validateField('date', req, false);

          numericCheck.should.be.an.instanceof(ErrorClass);
          numericCheck.should.have.property('key').and.equal('date');
          numericCheck.should.have.property('type').and.equal('numeric');
        });

      });

      describe('format error', () => {

        it('returns an error class when the field is incorrectly formatted', () => {
          req.form.values.date = '01-13-1982';
          const formatCheck = controller.validateField('date', req, false);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('format');
        });

      });

      describe('future error', () => {

        it('returns an error class when the field is in the future', () => {
          req.form.values.date = moment().add(1, 'day').format('DD-MM-YYYY');
          const formatCheck = controller.validateField('date', req, false);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('future');
        });

      });

    });

    describe('valid field', () => {

      it('returns undefined', () => {
        req.form.values.date = '01-01-2015';
        should.equal(controller.validateField('date', req), undefined);
      });
    });

    describe('when the key is not a date', () => {
      it('calls the parent class validateField', () => {
        Controller.prototype.validateField.returns('parent controller');

        controller.validateField('first-name', req).should.equal('parent controller');
      });
    });
  });

  describe('validateDateField', () => {
    beforeEach(() => {
      sinon.stub(DateController.prototype, 'getValidatorTypes').returns([]);
    });

    afterEach(() => {
      DateController.prototype.getValidatorTypes.restore();
    });

    it('returns if the field has a dependent which is not satisfied', () => {
      const req = {
        form: {
          values: {
            'dependent-field': 'dependent-value'
          }
        }
      };
      controller.options.fields.date.dependent = {
        field: 'dependent-field',
        value: 'dependent-value'
      };
      chai.expect(controller.validateDateField(req, 'date')).to.be.undefined;
    });
  });

  describe('.process()', () => {
    describe('with all date parts', () => {
      const req = {
        form: {
          values: {
            'date-day': '01',
            'date-month': '01',
            'date-year': '2015'
          }
        }
      };
      let callback;

      beforeEach(() => {
        callback = sinon.stub();
        controller = new DateController(args);
        controller.dateKey = 'date';
        controller.process(req, {}, callback);
      });

      it('creates a date field', () => {
        req.form.values.date.should.equal('01-01-2015');
      });
      it('calls callback', () => {
        callback.should.have.been.called;
      });

    });
    describe('with missing date parts', () => {
      const req = {
        form: {
          values: {
            'date-day': '01',
            'date-month': '',
            'date-year': '2015'
          }
        }
      };
      let callback;

      beforeEach(() => {
        callback = sinon.stub();
        controller = new DateController({template: 'index'});
        controller.dateKey = 'date';
        controller.process(req, {}, callback);
      });
      it('creates a date field', () => {
        should.equal(req.form.values.date, undefined);
      });
      it('calls callback', () => {
        callback.should.have.been.called;
      });
    });
  });

  describe('format', () => {
    const req = {
      form: {
        values: {}
      }
    };
    let callback;

   beforeEach(() => {
      callback = sinon.stub();
      controller = new DateController({template: 'index'});
      controller.dateKey = 'date';
      controller.options = {};
      controller.process(req, {}, callback);
    });

    it('formats the date property to GDS style date if no prettyDate option passed in', () => {
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';

      controller.format(req);
      req.form.values['date-formatted'].should.equal('1 November 1982');
    });

    it('takes a custom date style date if prettyDate option passed in', () => {
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';
      controller.options.prettyDate = 'D/MMMM/YYYY';

      controller.format(req);
      req.form.values['date-formatted'].should.equal('1/November/1982');
    });

    it('sets dataFormat to DD-MM-YYYY if no dateFormat option passed in', () => {
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';
      req.form.values.date.should.equal('01-11-1982');
    });

    it('takes a custom date format if the dateFormat option passed in', () => {
      callback = sinon.stub();
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';
      controller.options.dateFormat = 'YYYY MM DD';

      controller.process(req, {}, callback);
      req.form.values.date.should.equal('1982 11 01');
    });
  });

});
