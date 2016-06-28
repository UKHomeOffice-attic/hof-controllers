'use strict';

module.exports = function lambdas(req, res) {
  Object.assign(res.locals, {
    renderField() {
      return function renderFieldMixin() {
        const mixin = this.mixin;
        if (this.useWhen) {
          const condition = typeof this.useWhen === 'string'
            ? req.sessionModel.get(this.useWhen) === true
            : req.sessionModel.get(this.useWhen.field) !== this.useWhen.value;
          if (condition) {
            req.sessionModel.unset(this.key);
            return null;
          }
        }
        if (mixin && res.locals[mixin] && typeof res.locals[mixin] === 'function') {
          return res.locals[mixin]().call(Object.assign({}, res.locals, this), this.key);
        }
      };
    }
  });
};
