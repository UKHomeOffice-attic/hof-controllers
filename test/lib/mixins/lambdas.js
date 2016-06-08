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
    const scope = {
      key: 'a-key',
      mixin: 'a-mixin'
    };
    let renderField;
    let mixinStub;
    let renderFieldMixin;

    beforeEach(() => {
      renderField = res.locals.renderField;
      mixinStub = sinon.stub();
      renderFieldMixin = renderField();
      res.locals['a-mixin'] = () => mixinStub;
    });

    it('should return a function', () => {
      renderField().should.be.a('function');
    });

    it('should lookup a mixin from res.locals and call it with key if found', () => {
      renderFieldMixin.call(scope);
      mixinStub.should.have.been.calledOnce.and.calledWithExactly('a-key');
    });

    it('exposes res.locals to the called mixin', () => {
      mixinStub.returnsThis();
      res.locals.foo = 'bar';
      renderFieldMixin.call(scope);
      mixinStub.returnValues[0].should.have.property('foo').and.equal('bar');
    });
  });
});
