'use strict';

const proxyquire = require('proxyquire');

describe('Helpers', () => {
  let helpers;
  let hoganStub;
  let renderStub;
  beforeEach(() => {
    renderStub = sinon.stub();
    hoganStub = {
      compile: sinon.stub().returns({
        render: renderStub
      })
    };
    helpers = proxyquire('../../../lib/util/helpers', {
      'hogan.js': hoganStub
    });
  });

  describe('getStepFromFieldName()', () => {
    let steps;
    beforeEach(() => {
      steps = {
        '/step-1': {
          fields: [
            'field-1',
            'field-2',
            'field-3'
          ]
        },
        '/step-2': {
          fields: [
            'field-4',
            'field-5'
          ]
        },
        '/step-3': {
          fields: [
            'field-6'
          ]
        }
      };
    });

    it('returns the name of the step the field is found in', () => {
      helpers.getStepFromFieldName('field-3', steps).should.be.equal('/step-1');
      helpers.getStepFromFieldName('field-5', steps).should.be.equal('/step-2');
      helpers.getStepFromFieldName('field-6', steps).should.be.equal('/step-3');
    });

    it('returns undefined on failed lookup', () => {
      chai.expect(helpers.getStepFromFieldName('field-7', steps)).to.be.undefined;
    });
  });

  describe('isEmptyValue', () => {
    it('returns true when called with undefined', () => {
      helpers.isEmptyValue(undefined).should.be.true;
    });

    it('returns true when called with null', () => {
      helpers.isEmptyValue(null).should.be.true;
    });

    it('returns true when called with \'\'', () => {
      helpers.isEmptyValue('').should.be.true;
    });

    it('returns false when called with 0', () => {
      helpers.isEmptyValue(0).should.be.false;
    });

    it('returns false when called with false', () => {
      helpers.isEmptyValue(false).should.be.false;
    });
  });

  describe('getTitle()', () => {
    let lookup;
    let fields;
    beforeEach(() => {
      lookup = sinon.stub();
      fields = {
        'field-one': {}
      };
    });

    it('calls lookup with the correct list of keys', () => {
      const expected = [
        'pages.step-one.header',
        'fields.field-one.label',
        'fields.field-one.legend'
      ];
      helpers.getTitle('step-one', lookup, fields);
      lookup.firstCall.args[0].should.be.deep.equal(expected);
    });

    it('passes the locals hash to lookup as second arg', () => {
      const locals = {};
      helpers.getTitle('step-one', lookup, fields, locals);
      lookup.firstCall.args[1].should.be.equal(locals);
    });
  });

  describe('getIntro()', () => {
    let lookup;
    beforeEach(() => {
      lookup = sinon.stub();
    });

    it('calls lookup with the correct list of keys', () => {
      const expected = [
        'pages.step-one.intro'
      ];
      helpers.getIntro('step-one', lookup);
      lookup.firstCall.args[0].should.be.deep.equal(expected);
    });

    it('passes locals too lookup as second arg', () => {
      const locals = {};
      helpers.getIntro('step-one', lookup, locals);
      lookup.firstCall.args[1].should.be.equal(locals);
    });
  });

  describe('hasOptions()', () => {
    it('returns true for radio-group', () => {
      helpers.hasOptions('radio-group').should.be.true;
    });

    it('returns true for checkbox-group', () => {
      helpers.hasOptions('checkbox-group').should.be.true;
    });

    it('returns true for select', () => {
      helpers.hasOptions('select').should.be.true;
    });

    it('returns false for input-text', () => {
      helpers.hasOptions('input-text').should.be.false;
    });

    it('returns false for textarea', () => {
      helpers.hasOptions('textarea').should.be.false;
    });
  });

  describe('getValue()', () => {
    let translate;

    beforeEach(() => {
      translate = sinon.stub();
    });

    it('calls translate passing the path of the option', () => {
      helpers.getValue(translate, 'field-1', 'value');
      translate.should.have.been.calledWith('fields.field-1.options.value.label');
    });

    it('returns the translation value if different from the key', () => {
      const value = 'A Value';
      translate.withArgs('fields.field-1.options.value.label').returns(value);
      helpers.getValue(translate, 'field-1', 'value').should.be.equal(value);
    });

    it('returns the value if lookup fails', () => {
      const value = 'value';
      const key = 'fields.field-1.options.value.label';
      translate.withArgs(key).returns(key);
      helpers.getValue(translate, 'field-1', value).should.be.equal(value);
    });
  });

  describe('conditionalTranslate()', () => {
    it('returns undefined if the lookup fails', () => {
      function translate(key) {
        return key;
      }
      chai.expect(helpers.conditionalTranslate(translate, 'a-key')).to.be.undefined;
    });

    it('returns the return value of translate if different from the key', () => {
      const result = 'something';
      function translate() {
        return result;
      }
      helpers.conditionalTranslate(translate, 'a-key').should.be.equal(result);
    });
  });

  describe('getTranslation()', () => {
    it('returns the key if lookup fails', () => {
      function translate(key) {
        return key;
      }
      helpers.getTranslation(translate, 'a-key').should.be.equal('a-key');
    });
  });

  it('returns the summary value for page if it exists', () => {
    function translate(key) {
      if (key === 'pages.page.summary') {
        return 'summary';
      }
    }
    helpers.getTranslation(translate, 'page').should.be.equal('summary');
  });

  it('returns the header value for page if summary lookup fails', () => {
    function translate(key) {
      if (key === 'pages.page.summary') {
        return 'pages.page.summary';
      }
      if (key === 'pages.page.header') {
        return 'header';
      }
    }
    helpers.getTranslation(translate, 'page').should.be.equal('header');
  });

  it('returns the summary value for a field if exists', () => {
    function translate(key) {
      if (key === 'fields.field.summary') {
        return 'summary';
      }
    }
    helpers.getTranslation(translate, 'field', true).should.be.equal('summary');
  });

  it('returns the label value for field if summary lookup fails', () => {
    function translate(key) {
      if (key === 'fields.field.summary') {
        return 'fields.field.summary';
      }
      if (key === 'fields.field.label') {
        return 'label';
      }
    }
    helpers.getTranslation(translate, 'field', true).should.be.equal('label');
  });

  it('returns the legend value for field if summary and label lookups fail', () => {
    function translate(key) {
      if (key === 'fields.field.summary') {
        return 'fields.field.summary';
      }
      if (key === 'fields.field.label') {
        return 'fields.field.label';
      }
      if (key === 'fields.field.legend') {
        return 'legend';
      }
    }
    helpers.getTranslation(translate, 'field', true).should.be.equal('legend');
  });
});
