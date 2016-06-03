# Date Controller

Accessed as `date` from `hof-controllers`

```js
const dateController = require('hof-controllers').date;
```

Extends from `require('hof-controllers').base;`

## Usage

Override the base controller with the data controller on a step by step basis, e.g. in `steps.js`

```
{
  '/my-page-with-date-field': {
    fields: [
      'my-date',
      'my-date-day',
      'my-date-month',
      'my-date-year'
    ],
    controller: require('hof-controllers').date,
    dateKey: 'my-date'
  }
}
```

## validation

- Validates the dates as a single item.

- Date validators default to: `required`, `numeric`, `format` (`DD-MM-YYYY`), and `future`.

- What the validators validate against can be overridden with the `validate` property on the date fields' `validate` property.

In this example, the `'my-date'` fields will only validate if they contain non-numeric characters.

```js
{
  'my-date': {
    validate: ['numeric']
  }
}
```

Note: In the preceding example the field is not required and will not error on empty values.

## Extend and override `validateField`

If you want a shared date field to be required, but on a particular page wish it to be optional, `validateField` will accept a third parameter called `isRequired`.
This will allow the date field to be optional unless the user enters a value, in which case an appropriate message will be shown.

```js
MyController.prototype.validateField = (keyToValidate, req) =>
  super.validateField(keyToValidate, req, false)
```

## Formatting

- Stores a 'pretty' formatted (`D MMMM YYYY`) date to the form values on the sessionModel.

Access the value as `<name of your dateKey>-formatted`
