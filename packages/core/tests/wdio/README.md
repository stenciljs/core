# WebdriverIO Component Tests

This directory contains a set of Stencil component tests that verify various
scenarios involving user interaction or rendering of a component.

The following scripts are available:

- `npm run build`: builds all components as lazy-bundle
- `npm run wdio`: runs the WebdriverIO tests
- `npm test`: runs the build and wdio script sequentially

You can filter specific scenarios by using the `--spec` parameter, e.g.:

```sh
npm run wdio -- --spec conditional-basic
# runs test/wdio/conditional-basic/cmp.test.tsx
```

To debug a test, it is recommended to start the test in "watch" mode:

```sh
npm run wdio -- --spec conditional-basic --watch
```

This allows to make changes to the test and have it re-run automatically. If you make changes to a test component you have to re-run the build script manually in another terminal window.

## Test Setup

All components have to be compiled into a lazy-loaded Stencil component before executing the WebdriverIO test. WebdriverIO runs a set-up script (see `test/wdio/setup.ts`) to register all compiled custom components and have them available in your test. No additional imports are required.

## Creating a new Test Suite

WebdriverIO tests live in subdirectories within `test/wdio` alongside the
components that they test. This keeps everything colocated and tidy!

To start a new test suite, first create a new, descriptively-named directory:

```sh
mkdir test/wdio/my-excellent-new-test-suite
```

These are descriptively named, with a title that is either a noun or verb that
succinctly describes the test (`svg-class`, `slot-nested-order`,
`slot-hide-content`, etc).

After you've got a directory to work with, create a new Stencil component in
that directory which is a minimal example of the behavior you're trying to
test. The convention is to write this to a file called `cmp.tsx` within your
directory. You can set the tag name and component class name to whatever you
like, but try to ensure that your naming is relevant to what is being tested
(prefer `<slot-relocation>` over `<my-test-component-2>`).

> [!IMPORTANT]
> Your new component must have a unique tag name that does not collide with
> another component's tag name!

You'll want to also create a new test file in that same directory. Your file
must end with `.test.tsx`. The convention is to take the filename used for the
test suite's main component and change the extension, so if our component was
saved in `cmp.tsx` we'd put our tests in `cmp.test.tsx`.

Once you've created your component and test file proceed to write some tests!

> [!NOTE]
> You'll need to run `npm run build` in `test/wdio` in order for your component
> to be available in tests. If you run WebdriverIO tests from the root of the
> project using `npm run test.wdio` this will be run automatically.

## Writing Tests

To render a given component, use the `render` helper method from `@wdio/browser-runner/stencil`, e.g.:

```tsx
import { render } from '@wdio/browser-runner/stencil';

render({
  template: () => <my-component></my-component>,
});
```

It is advised to use the common `describe`/`it` syntax to structure your test. Hooks like `beforeEach` can be helpful to render the component into the page. A simple example would be:

```tsx
import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('attribute-basic', function () {
  before(async () => {
    render({
      template: () => <attribute-basic-root></attribute-basic-root>,
    });
  });

  it('button click rerenders', async () => {
    await expect($('.single')).toHaveText('single');
    // ...
  });
});
```

## Asynchronous Matcher

It is recommended to use WebdriverIO's async matcher for all state evaluations of your component. It allows WebdriverIO to rerun the expected condition multiple times until it either passes or fails due to a timeout. This prevents race conditions from happening. For example:

```ts
// 👎 element could not be rendered at given time nor have the correct text
expect(document.querySelector('.single').textContent).toBe('single');
// 👍 allows WebdriverIO to fetch and assert the content of the component until condition is met
await expect($('.single')).toHaveText('single');
```

## Resources

For further information on how to write component tests with WebdriverIO, take a look at the official docs.

- [WebdriverIO Component Testing](https://webdriver.io/docs/component-testing)
- [WebdriverIO API](https://webdriver.io/docs/api)
- [WebdriverIO Expect Matchers](https://webdriver.io/docs/api/expect-webdriverio)