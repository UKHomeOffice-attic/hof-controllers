'use strict';

const lambdas = require('../../../lib/middleware/lambdas');

describe('Lambdas', () => {
  it('is a function', () => {
    lambdas.should.be.a('function');
  });

  describe('Middleware', () => {
    const req = {
      sessionModel: {
        get: sinon.stub().withArgs('another-key').returns('stubbedValue'),
        unset: sinon.stub()
      }
    };
    const res = {
      locals: {}
    };
    let next;
    let lambdasMiddleware;

    beforeEach(() => {
      next = sinon.stub();
      lambdasMiddleware = lambdas();
      lambdasMiddleware(req, res, next);
    });

    it('is a funtion', () => {
      lambdasMiddleware.should.be.a('function');
    });

    it('expects 3 arguments', () => {
      lambdasMiddleware.length.should.be.equal(3);
    });

    it('should expose a renderField method via res.locals', () => {
      res.locals.should.have.property('renderField').and.be.a('function');
    });

    it('calls next', () => {
      next.should.have.been.calledOnce;
    });

    describe('renderField', () => {
      let scope = {
        key: 'a-key',
        mixin: 'a-mixin'
      };
      let renderField;
      let mixinStub;
      let renderFieldMixin;

      beforeEach(() => {
        mixinStub = sinon.stub();
        renderField = res.locals.renderField;
        mixinStub = sinon.stub();
        renderFieldMixin = renderField();
        res.locals['a-mixin'] = () => mixinStub;
      });

      it('should return a function', () => {
        renderField().should.be.a('function');
      });

      it('should lookup a mixin from res.locals and call it with key if found', () => {
        res.locals['a-mixin'] = () => mixinStub;
        renderFieldMixin.call(scope);
        mixinStub.should.have.been.calledOnce.and.calledWithExactly('a-key');
      });

      it('exposes res.locals to the called mixin', () => {
        mixinStub.returnsThis();
        res.locals.foo = 'bar';
        renderFieldMixin.call(scope);
        mixinStub.returnValues[0].should.have.property('foo').and.equal('bar');
      });

      describe('with useWhen', () => {
        describe('condition not met', () => {
          beforeEach(() => {
            renderFieldMixin = renderField();
            scope = {
              key: 'a-key',
              mixin: 'a-mixin',
              useWhen: {
                field: 'another-key',
                value: 'incorrect-value'
              }
            };

            res.locals['a-mixin'] = () => mixinStub;
          });


          it('returns null', () => {
            chai.expect(renderFieldMixin.call(scope)).to.be.equal(null);
          });

          it('doesn\'t call the mixin', () => {
            renderFieldMixin.call(scope);
            mixinStub.should.not.have.been.called;
          });

          it('unsets a-key from the sessionModel', () => {
            renderFieldMixin.call(scope);
            req.sessionModel.unset.should.have.been.calledWithExactly('a-key');
          });
        });

        describe('condition met', () => {
          it('looks up and calls the mixin from res.locals', () => {
            renderFieldMixin = renderField();
            scope = {
              key: 'a-key',
              mixin: 'a-mixin',
              useWhen: {
                field: 'a-key',
                value: 'stubbedValue'
              }
            };
            renderFieldMixin.call(scope);
            mixinStub.should.have.been.calledOnce;
          });
        });
      });
    });
  });
});
