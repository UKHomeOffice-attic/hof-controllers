# Confirm Controller

Extends the base controllers' locals method to provide data in a format suitable for generating a summary table.

Accessed as `confirm` from `hof-controllers`.

```js
const ConfirmController = require('hof-controllers').confirm;
```

Extends from `require('hof-controllers').base`

## Usage

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
      'field-two': (values) => values['field-two'].toUpperCase()
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

## Mixins

### renderField

The renderField mixin can be called in your template with the field to render as the scope. This will lookup the field.mixin in res.locals and call it passing the field key.

```html
{{#fields}}
  {{#renderField}}{{/renderField}}
{{/fields}}
```
