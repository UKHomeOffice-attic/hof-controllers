# Base Controller

Accessed as `base` from `hof-controllers`

```js
const baseController = require('hof-controllers').base;
```

Extends from [passports-form-wizard](https://github.com/UKHomeOffice/passports-form-wizard) Wizard, Form Controller.

## Added functionality for clearing sessions

```js
{
  clearSession: true,
  /* step options */
}
```
## Handles edit actions.

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

## Locals for pluralisation

Adds `single` or `multiple` to the locals to describe the number of errors for pluralisation of error messages.

## Exposes meta to templates

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

#### Exposes fields to templates

Fields given in step config will be exposed to the template along with a mixin if defined in field config. This can be used with the [renderField](#renderField) mixin to programmatically generate templates.

steps.js
```js
steps: {
  'step-1': {
    fields: [
      'field-1',
      'field-2'
    ]
  }
}
```

fields.js
```js
fields: {
  'field-1': {
    mixin: 'input-text',
    ...
  },
  'field-2': {
    mixin: 'radio-group',
    ...
  }
}
```

exposed to templates in format:
```js
fields: [{
  key: 'field-1',
  mixin: 'input-text'
}, {
  key: 'field-2',
  mixin: 'radio-group'
}]
```
