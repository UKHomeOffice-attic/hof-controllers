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

## Handles journey forking

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
    condition: (req, res) => req.form.values['name'].length > 30
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
    condition: (req, res) => req.form.values['name'].length > 30
  }, {
    target: '/fork-page-two',
    condition: {
      field: 'example-radio',
      value: 'superman'
    }
  }, {
    target: '/fork-page-three',
    condition: (req, res) => typeof req.form.values['email'] === 'undefined'
  }]
}
```
