'use strict';

const BaseController = require('./base-controller');
const ErrorClass = require('./error');
const moment = require('moment');
const _ = require('lodash');
const dateFormat = 'DD-MM-YYYY';
const prettyDate = 'D MMMM YYYY';

const hasValue = (req, key) => _.identity(req.form.values[key]);

const validators = [
  {
    method(value) {
      return value === '' || value === undefined;
    },
    type: 'required'
  },
  {
    method(value) {
      const valueParts = value.split('-');
      return _.some(valueParts, part => /\D/.test(part));
    },
    type: 'numeric'
  },
  {
    method(value) {
      return moment(value, dateFormat).isValid(dateFormat) === false;
    },
    type: 'format'
  },
  {
    method(value) {
      return moment(value, dateFormat).isAfter(moment()) === true;
    },
    type: 'future'
  }
];

module.exports = class DateController extends BaseController {
  constructor(options) {
    super(options);
    this.options = options || {};
    this.dateKey = this.options.dateKey || null;
  }

  getValidatorTypes(key) {
    return this.options.fields[key].validate || _.map(validators, 'type');
  }

  validateDateField(req, key) {
    const value = req.form.values[this.dateKey];
    const validatorTypes = this.getValidatorTypes(key);
    const field = this.options.fields[key];
    if (field.dependent && req.form.values[field.dependent.field] !== field.dependent.value) {
      return;
    }

    const type = _.result(_.find(validators, validator => {
      if (validatorTypes.indexOf(validator.type) !== -1) {
        return validator.method(value);
      }
    }), 'type');
    if (type) {
      /* eslint-disable consistent-return */
      return new ErrorClass(this.dateKey, {
        key: this.dateKey,
        redirect: undefined,
        type
      });
      /* eslint-enable consistent-return */
    }
  }

  isDateField(key) {
    return key.indexOf(this.dateKey) !== -1;
  }

  isDateKey(key) {
    return key === this.dateKey;
  }

  doValidate(req, key) {
    if (this.isDateKey(key)) {
      return _.filter(
        _.keys(req.form.values), k => this.isDateField(k)
      ).some(hasValue.bind(null, req));
    }
  }

  validateField(key, req, isRequired) {
    if (typeof isRequired !== 'boolean') {
      isRequired = true;
    }

    if (isRequired === true && this.isDateKey(key)) {
      return this.validateDateField(req, key);
    }

    if (isRequired === false && this.doValidate(req, key)) {
      return this.validateDateField(req, key);
    }

    if (isRequired === false && this.isDateKey(key)) {
      return undefined;
    }

    return super.validateField(key, req, isRequired);
  }

  saveValues(req, res, callback) {
    this.format(req);
    super.saveValues(req, res, callback);
  }

  process(req, res, callback) {
    const format = this.options.dateFormat ? this.options.dateFormat : dateFormat;

    const dateParts = {};
    const keys = _.keys(req.form.values);

    _.each(keys, id => {
      const idParts = id.split('-');
      const name = idParts[idParts.length - 1];
      const value = req.form.values[id];

      if (value) {
        dateParts[name] = value;
      }
    });

    if (dateParts.day && dateParts.month && dateParts.year) {
      req.form.values[this.dateKey] = moment(
        [dateParts.day, dateParts.month, dateParts.year].join(' '), 'DD MM YYYY'
      ).format(format);
    }

    callback();
  }

  format(req) {
    const format = this.options.prettyDate ? this.options.prettyDate : prettyDate;

    if (req.form.values[this.dateKey + '-day']) {
      const day = req.form.values[this.dateKey + '-day'];
      let month = req.form.values[this.dateKey + '-month'];
      month = parseInt(month, 10) - 1;
      const year = req.form.values[this.dateKey + '-year'];
      const formattedDate = moment([year, month, day]);
      req.form.values[this.dateKey + '-formatted'] = formattedDate.format(format);
    }
  }
};
