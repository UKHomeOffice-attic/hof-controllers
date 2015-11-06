'use strict';

var ErrorClass = require('hof').wizard.Error;
var util = require('util');

var ErrorController = function ErrorController() {
  ErrorClass.apply(this, arguments);
};

util.inherits(ErrorController, ErrorClass);

module.exports = ErrorController;
