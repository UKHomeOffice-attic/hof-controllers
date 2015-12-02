'use strict';

var Controller = sinon.stub();
Controller.prototype = {};
Controller.prototype.validateField = sinon.stub();

var proxyquire = require('proxyquire');
var TypeaheadController = proxyquire('../../lib/typeahead-controller', {
  './base-controller': Controller
});
var ErrorClass = require('../../lib/error-controller');

describe('lib/typeahead-controller', function () {

  var controller;
  var args = {
    fields: {
      country: {
        typeahead: {
          list: ['England', 'France', 'Poland']
        }
      }
    }
  };

  beforeEach(function () {
    controller = new TypeaheadController(args);
    controller.options = args;
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

    describe('validating the list', function () {
      it('returns Error if the item is not on the list', function () {
        req.form.values.country = 'Polska';
        var countryListCheck = controller.validateField('country', req);

        countryListCheck.should.be.an.instanceof(ErrorClass);
        countryListCheck.should.have.property('key').and.equal('country');
        countryListCheck.should.have.property('type').and.equal('typeahead');
      });

      it('calls the base controller if a country is on the list', function () {
        req.form.values.country = 'Poland';
        controller.validateField('country', req);

        Controller.should.have.been.called;
      });

      describe('dependent fields', function () {
        it('calls the parent controller if the dependent field is not present', function () {
          controller.options = {
            dependent: {
              field: 'other-field',
              value: 'yes'
            },
            fields: {
              country: {
                typeahead: {
                  list: ['England', 'France', 'Poland']
                }
              }
            }
          };

          req.form.values = {
            country: 'Poland'
          };

          controller.validateField('country', req);

          Controller.should.have.been.called;
        });

        it('errors if dependent field is present and the item is not on the list', function () {
          controller.options = {
            dependent: {
              field: 'other-field',
              value: 'yes'
            },
            fields: {
              country: {
                typeahead: {
                  list: ['England', 'France', 'Poland']
                }
              }
            }
          };

          req.form.values = {
            country: 'Polska',
            'other-field': 'yes'
          };

          var countryListCheck = controller.validateField('country', req);

          countryListCheck.should.be.an.instanceof(ErrorClass);
        });
      });
    });

  });

});
