'use strict';

var proxyquire = require('proxyquire');
var moment = require('moment');

var Controller = sinon.stub();
Controller.prototype = {};
Controller.prototype.validateField = sinon.stub();

var DateController = proxyquire('../../lib/date-controller', {
  './base-controller': Controller
});

var ErrorClass = require('../../lib/error-controller');

describe('lib/date-controller', function () {

  var controller;
  var args = {template: 'index'};

  beforeEach(function () {
    controller = new DateController(args);
    controller.dateKey = 'date';
    controller.options = {};
    controller.options.fields = {
     'date': {}
    };
  });

  describe('instantiated', function () {
    it('calls Controller with the arguments', function () {
      Controller.should.have.been.called;
    });
  });

  describe('validateField(keyToValidate, req)', function () {

    var req = {
      form: {
        values: {}
      }
    };

    describe('validation', function () {

      describe('required error', function () {

        it('returns an error class when the field is undefined', function () {
          req.form.values.date = undefined;
          var undefinedCheck = controller.validateField('date', req);

          undefinedCheck.should.be.an.instanceof(ErrorClass);
          undefinedCheck.should.have.property('key').and.equal('date');
          undefinedCheck.should.have.property('type').and.equal('required');
        });

        it('returns an error class when the field is an empty string', function () {
          req.form.values.date = '';
          var emptyStringCheck = controller.validateField('date', req);

          emptyStringCheck.should.be.an.instanceof(ErrorClass);
          emptyStringCheck.should.have.property('key').and.equal('date');
          emptyStringCheck.should.have.property('type').and.equal('required');
        });

      });

      describe('numeric error', function () {

        it('returns an error class when the field is not numeric', function () {
          req.form.values.date = 'ab-cd-efgh';
          var numericCheck = controller.validateField('date', req);

          numericCheck.should.be.an.instanceof(ErrorClass);
          numericCheck.should.have.property('key').and.equal('date');
          numericCheck.should.have.property('type').and.equal('numeric');
        });

      });

      describe('format error', function () {

        it('returns an error class when the field is incorrectly formatted', function () {
          req.form.values.date = '01-13-1982';
          var formatCheck = controller.validateField('date', req);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('format');
        });

      });

      describe('future error', function () {

        it('returns an error class when the field is in the future', function () {
          req.form.values.date = moment().add(1, 'day').format('DD-MM-YYYY');
          var formatCheck = controller.validateField('date', req);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('future');
        });

      });

      describe('can be overridden', function () {

        it('does not return an error for non-numeric values if numeric is not specficied as a validator', function () {
          controller.options.fields.date.validate = ['required', 'format', 'future'];
          req.form.values.date = 'ab-cd-efgh';

          var error = controller.validateField('date', req);
          error.should.have.property('type').and.not.equal('numeric');
        });

        it('does not return an error if validate property is empty', function () {
          controller.options.fields.date.validate = [];
          req.form.values.date = 'ab-cd-efgh';

          var error = controller.validateField('date', req);
          should.equal(error, undefined);
        });

      });

    });

    describe('when the date is not required', function () {

      describe('required error', function () {

        it('does not return an error when the field is undefined', function () {
          req.form.values.date = undefined;

          should.equal(controller.validateField('date', req, false), undefined);
        });

        it('does not return an error when the field is an empty string', function () {
          req.form.values.date = '';

          should.equal(controller.validateField('date', req, false), undefined);
        });

      });

      describe('numeric error', function () {

        it('returns an error class when the field is not numeric', function () {
          req.form.values.date = 'ab-cd-efgh';
          var numericCheck = controller.validateField('date', req, false);

          numericCheck.should.be.an.instanceof(ErrorClass);
          numericCheck.should.have.property('key').and.equal('date');
          numericCheck.should.have.property('type').and.equal('numeric');
        });

      });

      describe('format error', function () {

        it('returns an error class when the field is incorrectly formatted', function () {
          req.form.values.date = '01-13-1982';
          var formatCheck = controller.validateField('date', req, false);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('format');
        });

      });

      describe('future error', function () {

        it('returns an error class when the field is in the future', function () {
          req.form.values.date = moment().add(1, 'day').format('DD-MM-YYYY');
          var formatCheck = controller.validateField('date', req, false);

          formatCheck.should.be.an.instanceof(ErrorClass);
          formatCheck.should.have.property('key').and.equal('date');
          formatCheck.should.have.property('type').and.equal('future');
        });

      });

    });

    describe('valid field', function () {

      it('returns undefined', function () {
        req.form.values.date = '01-01-2015';
        should.equal(controller.validateField('date', req), undefined);
      });
    });

    describe('when the key is not a date', function () {
      it('calls the parent class validateField', function () {
        Controller.prototype.validateField.returns('parent controller');

        controller.validateField('first-name', req).should.equal('parent controller');
      });
    });
  });

  describe('.process()', function () {
    describe('with all date parts', function () {
      var callback;
      var req = {
        form: {
          values: {
            'date-day': '01',
            'date-month': '01',
            'date-year': '2015'
          }
        }
      };

      beforeEach(function () {
        callback = sinon.stub();
        controller = new DateController(args);
        controller.dateKey = 'date';
        controller.process(req, {}, callback);
      });

      it('creates a date field', function () {
        req.form.values.date.should.equal('01-01-2015');
      });
      it('calls callback', function () {
        callback.should.have.been.called;
      });

    });
    describe('with missing date parts', function () {
      var callback;
      var req = {
        form: {
          values: {
            'date-day': '01',
            'date-month': '',
            'date-year': '2015'
          }
        }
      };

      beforeEach(function () {
        callback = sinon.stub();
        controller = new DateController({template: 'index'});
        controller.dateKey = 'date';
        controller.process(req, {}, callback);
      });
      it('creates a date field', function () {
        should.equal(req.form.values.date, undefined);
      });
      it('calls callback', function () {
        callback.should.have.been.called;
      });
    });
  });

  describe('format', function () {
    var callback;
      var req = {
        form: {
          values: {}
        }
      };
      
     beforeEach(function () {
        callback = sinon.stub();
        controller = new DateController({template: 'index'});
        controller.dateKey = 'date';
        controller.options = {};
        controller.process(req, {}, callback);
      });

    it('formats the date property to GDS style date if no prettyDate option passed in', function () {
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';

      controller.format(req);
      req.form.values['date-formatted'].should.equal('1 November 1982');
    });

    it('takes a custom date style date if prettyDate option passed in', function () {
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';
      controller.options.prettyDate = 'D/MMMM/YYYY';

      controller.format(req);
      req.form.values['date-formatted'].should.equal('1/November/1982');
    });

    it('sets dataFormat to DD-MM-YYYY if no dateFormat option passed in', function() {
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';
      req.form.values.date.should.equal('01-11-1982');
    });

    it('takes a custom date format if the dateFormat option passed in', function () {
      var res = {};
      var callback = sinon.stub();
      req.form.values['date-day'] = '01';
      req.form.values['date-month'] = '11';
      req.form.values['date-year'] = '1982';
      controller.options.dateFormat = 'YYYY MM DD';

      controller.process(req, {}, callback);
      req.form.values.date.should.equal('1982 11 01');
    });
  });

});
