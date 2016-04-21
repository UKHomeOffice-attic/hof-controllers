'use strict';

var util = require('util');
var Controller = require('./base-controller');
var _ = require('lodash');

var ConfirmController = function ConfirmController(options) {
  Controller.apply(this, arguments);
  this.options = options || {};
};

util.inherits(ConfirmController, Controller);

/*
 * Utility function which returns the
 * name of the step a field is present on
 */
function getStepFromFieldName(fieldName, steps) {
  return _.findKey(steps, function findKey(step) {
    if (!step.fields) {
      return false;
    }
    return step.fields.indexOf(fieldName) > -1;
  });
}

/*
 * Utility function to create an array
 * of field objects made up of field name,
 * value and step
 */
function getFieldObjectsFromNames(fields, values, modifiers, steps) {
  return fields.filter(function filter(item) {
    return (values[item] !== undefined && values[item] !== '') || modifiers[item] !== undefined;
  }).map(function map(item) {
    var value = values[item];
    var step = getStepFromFieldName(item, steps);
    if (modifiers[item]) {
      value = modifiers[item](values);
    }
    return {
      name: item,
      value: value,
      step: step
    };
  });
}

ConfirmController.prototype.locals = function controllerLocals(req, res) {
  var locals = Controller.prototype.locals.apply(this, arguments);
  var config = _.cloneDeep(this.options).config || {};
  var tableSections = config.tableSections || [];
  var steps = this.options.steps;

  tableSections.forEach(function forEach(section, index, array) {
    array[index].fields = getFieldObjectsFromNames(
      section.fields,
      res.locals.values,
      config.modifiers || {},
      steps
    );
  });

  return _.extend({}, locals, {
    tableSections: tableSections
  });
};

module.exports = ConfirmController;
