'use strict';

const BaseController = require('./base-controller');
const _ = require('lodash');

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
 * value, origValue and step
 */
const getFieldObjectsFromNames = (fields, values, modifiers, steps, req) =>
  fields.filter(item => {
    return (values[item] !== undefined && values[item] !== '') || modifiers[item] !== undefined;
  }).map(name => {
    const step = getStepFromFieldName(name, steps);
    let fieldObject = {
      name,
      step,
      origValue: values[name],
      value: values[name]
    };
    if (modifiers[name]) {
      // this inside modifier has access to fieldObject
      fieldObject.value = modifiers[name].call(fieldObject, fieldObject.value, req);
    }
    return fieldObject;
  });

module.exports = class ConfirmController extends BaseController {
  locals(req, res) {
    const locals = super.locals(req, res);
    const config = _.cloneDeep(this.options).config || {};
    const tableSections = config.tableSections || [];
    const steps = this.options.steps;

    tableSections.forEach((section, index, array) => {
      array[index].fields = getFieldObjectsFromNames(
        section.fields,
        res.locals.values,
        config.modifiers || {},
        steps,
        req
      );
    });

    return _.extend({}, locals, {tableSections});
  }
};
