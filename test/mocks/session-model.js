'use strict';

var util = require('util');
var EventEmitter = require('events');

var SessionModel = function() {
  EventEmitter.call(this);
};

util.inherits(SessionModel, EventEmitter);

SessionModel.prototype.set = function(key, value) {
  this[key] = value;
};

SessionModel.prototype.get = function(key) {
  return this[key];
};

SessionModel.prototype.unset = function(key) {
  delete this[key];
};

module.exports = SessionModel;
