'use strict';

const ErrorClass = require('../../lib/error');

const request = require('reqres').req;
const response = require('reqres').res;

describe('Error', () => {
  let req;
  let res;

  beforeEach(() => {
    req = request({
      translate: sinon.stub().returnsArg(0)
    });
    res = response();
  });

  describe('getMessage', () => {
    it('uses the translate method from the initialising request to translate the message', () => {
      req.translate.withArgs('validation.key.required').returns('This field is required');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('This field is required');
    });

    it('uses default error message for field if no field and type specific message is defined', () => {
      req.translate.withArgs('validation.key.default').returns('Default field message');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('Default field message');
    });

    it('uses default error message for validation type if no field level message is defined', () => {
      req.translate.withArgs('validation.required').returns('Default required message');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('Default required message');
    });

    it('uses global default error message if no type of field level messages are defined', () => {
      req.translate.withArgs('validation.default').returns('Global default');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('Global default');
    });

    it('populates messages with field label', () => {
      req.translate.withArgs('validation.key.required').returns('Your {{label}} is required');
      req.translate.withArgs('fields.key.label').returns('Field label');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('Your field label is required');
    });

    it('populates messages with legend', () => {
      req.translate.withArgs('validation.key.required').returns('Your {{legend}} is required');
      req.translate.withArgs('fields.key.legend').returns('date');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('Your date is required');
    });

    it('populates maxlength messages with the maximum length', () => {
      req.translate.withArgs('validation.key.maxlength').returns('This must be less than {{maxlength}} characters');
      const error = new ErrorClass('key', { type: 'maxlength', arguments: [10] }, req);
      error.message.should.equal('This must be less than 10 characters');
    });

    it('populates minlength messages with the minimum length', () => {
      req.translate.withArgs('validation.key.minlength').returns('This must be no more than {{minlength}} characters');
      const error = new ErrorClass('key', { type: 'minlength', arguments: [10] }, req);
      error.message.should.equal('This must be no more than 10 characters');
    });

    it('populates exactlength messages with the required length', () => {
      req.translate.withArgs('validation.key.exactlength').returns('This must be {{exactlength}} characters');
      const error = new ErrorClass('key', { type: 'exactlength', arguments: [10] }, req);
      error.message.should.equal('This must be 10 characters');
    });

    it('populates past messages with the required difference', () => {
      req.translate.withArgs('validation.key.past').returns('This must be less than {{age}} ago');
      const error = new ErrorClass('key', { type: 'past', arguments: [5, 'days'] }, req);
      error.message.should.equal('This must be less than 5 days ago');
    });

    it('populates custom messages with the required constiable', () => {
      req.translate.withArgs('validation.key.custom').returns('This must be {{custom}}');
      const error = new ErrorClass('key', { type: 'custom', arguments: ['dynamic'] }, req);
      error.message.should.equal('This must be dynamic');
    });

    it('populates messages with values from `res.locals` when present', () => {
      req.translate.withArgs('validation.key.required').returns('This must be a {{something}}');
      res.locals.something = 'value';
      const error = new ErrorClass('key', { type: 'required' }, req, res);
      error.message.should.equal('This must be a value');
    });

    it('uses own translate method if no req.translate is defined', () => {
      delete req.translate;
      sinon.stub(ErrorClass.prototype, 'translate').returns('Custom translate');
      const error = new ErrorClass('key', { type: 'required' }, req);
      error.message.should.equal('Custom translate');
      ErrorClass.prototype.translate.restore();
    });
  });
});
