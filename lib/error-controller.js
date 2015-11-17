'use strict';

var ErrorClass = require('hmpo-form-wizard').Error;
var util = require('util');

var ErrorController = function ErrorController() {
  ErrorClass.apply(this, arguments);
};

util.inherits(ErrorController, ErrorClass);

module.exports = ErrorController;
