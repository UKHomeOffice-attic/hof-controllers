'use strict';

var util = require('util');
var Controller = require('./base-controller');
var ErrorClass = require('./error-controller');
var _ = require('underscore');

var TypeaheadController = function Received() {
  Controller.apply(this, arguments);
};

util.inherits(TypeaheadController, Controller);

TypeaheadController.prototype.validateField = function validateField(keyToValidate, req) {
  var typeahead = this.options.fields[keyToValidate].typeahead;
  var country = req.form.values[keyToValidate];
  var dependent = this.options.fields[keyToValidate].dependent;
  var isDependent = _.isObject(dependent);

  if (_.isObject(typeahead)) {
    typeahead.list = _.map(typeahead.list, function lowercaseValues(value) {
      return value.toLowerCase();
    });

    if (country && typeahead.list.indexOf(country.toLowerCase()) === -1) {
      if (!isDependent || (isDependent && req.form.values[dependent.field] === dependent.value)) {
        return new ErrorClass(keyToValidate, {
          key: keyToValidate,
          type: 'typeahead',
          redirect: undefined
        });
      }
    }
  }

  return Controller.prototype.validateField.apply(this, arguments);
};

module.exports = TypeaheadController;
