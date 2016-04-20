'use strict';

const lambdas = require('../../../lib/mixins/lambdas');

describe('Lambdas Mixins', () => {
  const req = {};
  const res = {
    locals: {}
  };
  const next = sinon.stub();

  beforeEach(() => {
    lambdas(req, res, next);
  });

  it('should expose a renderField method via res.locals', () => {
    res.locals.should.have.property('renderField').and.be.a('function');
  });

  describe('renderField', () => {
    let renderField;

    beforeEach(() => {
      renderField = res.locals.renderField;
    });

    it('should return a function', () => {
      renderField().should.be.a('function');
    });

    it('should lookup a mixin from res.locals and call it with key if found', () => {
      const mixinStub = sinon.stub();
      const renderFieldMixin = renderField();
      const scope = {
        key: 'a-key',
        mixin: 'a-mixin'
      };
      res.locals['a-mixin'] = () => mixinStub;
      renderFieldMixin.call(scope);
      mixinStub.should.have.been.calledOnce.and.calledWithExactly('a-key');
    });
  });
});
