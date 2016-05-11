'use strict';

var lambdas = require('../../../lib/mixins/lambdas');

describe('Lambdas Mixins', function () {
  var req = {};
  var res = {
    locals: {}
  };
  var next = sinon.stub();

  beforeEach(function () {
    lambdas(req, res, next);
  });

  it('should expose a renderField method via res.locals', function () {
    res.locals.should.have.property('renderField').and.be.a('function');
  });

  describe('renderField', function () {
    var renderField;

    beforeEach(function () {
      renderField = res.locals.renderField;
    });

    it('should return a function', function () {
      renderField().should.be.a('function');
    });

    it('should lookup a mixin from res.locals and call it with key if found', function () {
      var mixinStub = sinon.stub();
      var renderFieldMixin = renderField();
      var scope = {
        key: 'a-key',
        mixin: 'a-mixin'
      };
      res.locals['a-mixin'] = function() {
        return mixinStub;
      };
      renderFieldMixin.call(scope);
      mixinStub.should.have.been.calledOnce.and.calledWithExactly('a-key');
    });
  });
});
