# hof-controllers [![npm version](https://badge.fury.io/js/hof-controllers.svg)](https://badge.fury.io/js/hof-controllers) [![Build Status](https://travis-ci.org/UKHomeOffice/hof-controllers.svg)](https://travis-ci.org/UKHomeOffice/hof-controllers)

A collection of controllers extended from [passports-form-wizard](https://github.com/UKHomeOffice/passports-form-wizard) Wizard, Form Controller:
```js
require('hmpo-form-wizard').Controller
```

## Usage

```js
var controllers = require('hof-controllers');
```

### Base Controller

Accessed as `base` from `hof-controllers`

```js
var baseController = require('hof-controllers').base;
```

Extends from [passports-form-wizard](https://github.com/UKHomeOffice/passports-form-wizard) Wizard, Form Controller.

#### Added functionality for clearing sessions

```js
{
  clearSession: true,
  /* step options */
}
```

#### Added functionality for invalidating steps

Removing fields from the session when the value of another field is changed. In the following example, when the value of `a_field` is changed, `field_1` and `field_2` - and their values - will be removed from the session model. If all the fields in a step are removed in this way, the entire step is removed from the session model too.

This is useful when a user takes a fork in a journey, only to return to the fork and take the other route.

```js
a_field: {
    invalidates: ['field_1', 'field_2']
}
```

#### Handles edit actions.

In the wizard options

```js
  hofWizard(steps, fields, {
    /* wizard options */
    params: '/:action?'
  });
```

In the view template

```js
a href='page_name/edit'
```

Or override in step options

```js
{
  continueOnEdit: true
  /* step options */
}
```

#### Locals for pluralisation

Adds `single` or `multiple` to the locals to describe the number of errors for pluralisation of error messages.

#### Exposes meta to templates

Add a locals object to step config to expose configurable key/value pairs in the template. Useful for generating template partials programmatically. These will override any locals provided further up the tree.

Steps config
```js
'/step-name': {
  locals: {
    pageTitle: 'Page Title'
    foo: 'bar'
  }
}
```

Template
```html
<h1>{{pageTitle}}</h1>
<div class="{{foo}}"></div>
```

#### Handles journey forking

Each step definition accepts a `next` property, the value of which is the next route in the journey. By default, when the form is successfully submitted, the next steps will load. However, there are times when it is necessary to fork from the current journey based on a users response to certain questions in a form. For such circumstances there exists the `forks` property.

In this example, when the submits the form, if the field called 'example-radio' has the value 'superman', the page at '/fork-page' will load, otherwise '/next-page' will be loaded.

```js

'/my-page': {
  next: '/next-page',
  forks: [{
    target: '/fork-page',
    condition: {
      field: 'example-radio',
      value: 'superman'
    }
  }]
}
```

The condition property can also take a function. In the following example, if the field called 'name' is more than 30 characters in length, the page at '/fork-page' will be loaded.

```js

'/my-page': {
  next: '/next-page',
  forks: [{
    target: '/fork-page',
    condition: function (req, res) {
      return req.form.values['name'].length > 30;
    }
  }]
}
```

Forks is an array and therefore each fork is interrogated in order from top to bottom. The last fork whose condition is met will assign its target to the next page variable.

In this example, if the last condition resolves to true - even if the others also resolve to true - then the page at '/fork-page-three' will be loaded. The last condition to be met is always the fork used to determine the next step.

```js

'/my-page': {
  next: '/next-page',
  forks: [{
    target: '/fork-page-one',
    condition: function (req, res) {
      return req.form.values['name'].length > 30;
    }
  }, {
    target: '/fork-page-two',
    condition: {
      field: 'example-radio',
      value: 'superman'
    }
  }, {
    target: '/fork-page-three',
    condition: function (req, res) {
      return typeof req.form.values['email'] === 'undefined';
    }
  }]
}
```

--------------------------------

### Date Controller

Accessed as `
` from `hof-controllers`

```js
var dateController = require('hof-controllers').date;
```

Extends from `require('hof-controllers').base;`

#### Date validation

- Validates the dates as a single item.

- Date validators default to: `required`, `numeric`, `format` (`DD-MM-YYYY`), and `future`.

- What the validators the date validates against can be overridden with the `validate` property on the date key field.

In this example, the `'my-date'` fields will only validate if they contain non-numeric characters.

```js
{
  'my-date': {
    validate: ['numeric']
  }
}
```

Note: In the preceding example the field is not required and will not error on empty values.


#### Extend and override `validateField`

If you want a shared date field to be required, but on a particular page wish it to be optional, `validateField` will accept a third parameter called `isRequired`.
This will allow the date field to be optional unless the user enters a value, in which case an appropriate message will be shown.

```js
MyController.prototype.validateField = function validateField(keyToValidate, req) {
  return DateController.prototype.validateField.call(this, keyToValidate, req, false);
};
```

#### Formats date

- Adds a 'pretty' formatted (`D MMMM YYYY`) date to the form values.

------------------------------

### Error Controller

A simple wrapper around `require('hmpo-form-wizard').Error;` to make it easier to extend and customise error behaviour on error.

### Extending

To extend the functionality of a controller call the parent constructor and use node `util` to inherit the prototype;

`this.dateKey` is the value of the date field that the controller will process. The value of the `this.dateKey` must match the name of the date field.
[Read more about date fields](https://github.com/UKHomeOffice/hof/blob/master/documentation/fields.md#date-fields)

```js
var DateController = function DateController() {
  this.dateKey = 'my-date';
  Controller.apply(this, arguments);
};

util.inherits(DateController, Controller);
```
------------------------------

### Confirm Controller

Extends the base controller's locals method to provide data in a format suitable for generating a summary table.

Accessed as `confirm` from `hof-controllers`.

```js
var confirmController = require('hof-controllers').confirm;
```

Extends from `require('hof-controllers').base`

#### Usage

In step options

```js
'/confirm': {
  controller: require('hof-controllers').confirm,
  config: {
    tableSections: [{
      name: 'section-one',
      fields: [
        'field-one',
        'field-two',
        'field-three'
      ]
    }],
    modifiers: { // transform {{value}}, values hash provided
      'field-two': function(values) {
        return values['field-two'].toUpperCase();
      }
    }
  }
}
```

In config page template

```html
{{#tableSections}}
  {{> partials-summary-table}} <!-- {{name}}, {{value}} and {{step}} are available in this scope -->
{{/tableSections}}
```

------------------------------

## Test

```bash
$ npm test
```
