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

## Test

```bash
$ npm test
```

