'use strict';

const _ = require('lodash');
const BaseController = require('./base-controller');
const helpers = require('./util/helpers');

/**
 * Extends the BaseController extending res.locals
 * with tableSections - a formatted representation
 * of the sessionModel for contructing a confirm page
 * @class
 * @extends BaseController
 */
module.exports = class ConfirmController extends BaseController {
  /**
   * extends super.locals with tableSections - a formatted representation
   * of the user entered data grouped by section.
   * @param {Object} req - the HTTP request object
   * @param {Object} res - the HTTP response object
   * @returns {Object} return value of super.locals extended with tableSections
   */
  locals(req, res) {
    const data = req.sessionModel.toJSON();
    const steps = this.options.steps;
    const fields = this.options.fieldsConfig;
    const tableSections = _(steps)
      .reject(step => !step.locals || !step.fields || _.every(
        step.fields,
        field => helpers.isEmptyValue(data[field])
      ))
      .groupBy(step => step.locals.section)
      .map((groupedSteps, section) => ({
        section: helpers.getTranslation(req.translate, section),
        fields: _(groupedSteps)
          .map('fields')
          .flatten()
          .reject(field => (fields[field] &&
            fields[field].includeInSummary === false) ||
            helpers.isEmptyValue(data[field]))
          .map(field => ({
            field,
            step: helpers.getStepFromFieldName(field, steps),
            label: helpers.getTranslation(req.translate, field, true),
            value: helpers.hasOptions(fields[field].mixin) ?
              helpers.getValue(req.translate, field, data[field]) :
              data[field]
          }))
          .value()
      }))
      .value();
    return Object.assign({}, super.locals(req, res), {tableSections});
  }
};
