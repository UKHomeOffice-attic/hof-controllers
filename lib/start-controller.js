'use strict';

const BaseController = require('./base-controller');

module.exports = class StartController extends BaseController {

  constructor(options) {
    super(options);
  }

  getValues(req, res, callback) {
    req.sessionModel.reset();
    super.successHandler(req, res, callback);
  }

};
