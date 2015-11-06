# hof-controllers

A collection of controllers extended from [HOF](https://github.com/UKHomeOffice/hof) Wizard, Form Controller:
```js
require('hof').wizard.Controller
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

Extends from [HOF](https://github.com/UKHomeOffice/hof) Wizard, Form Controller.

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

Accessed as `date` from `hof-controllers`

```js
var dateController = require('hof-controllers').date;
```

Extends from `require('hof-controllers').base;`

#### Date validation

- Validates the dates as a single item.

- Date validators default to: `required`, `numeric`, `format` (`DD-MM-YYYY`), and `future`.

- What the validators the date validates against can be overridden with the `validate` property on the date key field.

In this example, the whole date will only validate if it contains non-numeric characters.

```js
{
  date: {
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

### Extending

To extend the functionality of a controller call the parent constructor and use node `util` to inherit the prototype;

```js
var DateController = function DateController() {
  Controller.apply(this, arguments);
};

util.inherits(DateController, Controller);
```
------------------------------

## Test

```bash
$ npm test
```

