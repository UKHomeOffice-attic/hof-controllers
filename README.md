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

## Test

```bash
$ npm test
```

