'use strict';

const _ = require('lodash');

module.exports = class Helpers {
  /**
   * Utility function which returns the
   * name of the step a field is present on
   * @param {String} field - id of the field
   * @param {Object} steps - steps config object
   * @returns {String} - the key of the step where field is found
   */
  static getStepFromFieldName(field, steps) {
    return _.findKey(steps, step => step.fields && step.fields.indexOf(field) > -1);
  }

  /**
   * Alternative 'falsy' check which doesn't
   * return false for 0 or false
   * @param {any} value - the value to check
   * @returns {Boolean} - if the value is 'empty'
   */
  static isEmptyValue(value) {
    return value === undefined || value === null || value === '';
  }

  /**
   * Utility function which returns true
   * if a field type has associated options
   * @param {String} mixin - the name of the mixin
   * @returns {Boolean} - if the mixin has associated options
   */
  static hasOptions(mixin) {
    return mixin === 'radio-group' || mixin === 'checkbox-group' || mixin === 'select';
  }

  /**
   * helper function for looking up values in
   * fields that have options
   * @param {Function} translate - translate function
   * @param {String} field - the id of the field
   * @param {any} value - the value of the field
   * @returns {any} the translation of the label if found,
   * the raw value if not
   */
   static getValue(translate, field, value) {
     let key = `fields.${field}.options.${value}.label`;
     let result = translate(key);
     if (result !== key) {
       return result;
     }
     return value;
  }

  /**
   * Utility function which looks up translations with fallback values
   * If the translation is for a field, it will first try fields.key.summary
   * If this fails it will try fields.key.label, if this fails it will try
   * fields.key.legend (radio-group and checkbox-group).
   *
   * If the translation is not for a field it will first try pages.key.summary,
   * if this fails it will fallback to pages.keys.header.
   * @param {Function} translate - translate function
   * @param {String} key - the key of the field/page
   * @param {Boolean} isField - if the translation is for a field
   * @return {String} the result of the translation
   */
  static getTranslation(translate, key, isField) {
    const base = isField ? 'fields' : 'pages';
    let path = `${base}.${key}.summary`;
    let result = translate(path);
    if (result === path) {
      if (isField) {
        path = `${base}.${key}.label`;
        result = translate(path);
        if (result === path) {
          path = `${base}.${key}.legend`;
          result = translate(path);
          if (result === path) {
            return key;
          }
        }
      } else {
        path = `${base}.${key}.header`;
        result = translate(path);
        if (result === path) {
          return key;
        }
      }
    }
    return result;
  }
};
