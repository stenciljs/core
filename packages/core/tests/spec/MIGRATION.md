# Migrating wdio Tests to @stencil/vitest

- We are migrating from WebDriverIO (wdio) to @stencil/vitest for testing Stencil components. 
- The wdio tests / fixtures generally are under `packages/core/tests/wdio` and the new @stencil/vitest tests should be under `packages/core/tests/spec/src/components` generally.
- The setup for @stencil/vitest is already done - you just need to sequentially migrate the tests from wdio to @stencil/vitest.
- Migrated fixtures should be renamed from: `cmp.tsx` to `DESCRIPTIVE_NAME.tsx` (e.g. `cmp.tsx` > `event-basic.tsx`)
- Migrated test files should be renamed from `cmp.test.tsx` to `DESCRIPTIVE_NAME.spec.tsx` (e.g. `cmp.test.tsx` > `event-basic.spec.tsx`).  
- If you are unsure about the correct migration path for a specific test, please ask user for guidance


This document outlines the key changes and provides examples for common test scenarios.

## Before / After

### wdio
```tsx
import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('attribute-basic', () => {
  before(async () => {
    render({
      template: () => <attribute-basic-root></attribute-basic-root>,
    });
  });

  it('button click rerenders', async () => {
    await $('attribute-basic.hydrated').waitForExist();
    const mainCmp = document.querySelector('attribute-basic');
    await expect($('.single')).toHaveText('single');
    await expect($('.multiWord')).toHaveText('multiWord');

    const button = await $('button');
    await button.click();

    await expect($('.single')).toHaveText('single-update');
  });
});
```

### @stencil/vitest
```tsx
import { render, h, describe, it, expect } from '@stencil/vitest';

describe('attribute-basic', () => {
  it('button click rerenders', async () => {
    const { root, waitForChanges } = await render(<attribute-basic-root />);
    // `root` is the main component
    expect(root.querySelector('.single')).toHaveTextContent('single');
    expect(root.querySelector('.multiWord')).toHaveTextContent('multiWord');

    root.querySelector('button')!.click();
    await waitForChanges();

    expect(root.querySelector('.single')).toHaveTextContent('single-update');
  });
});
```

## Events & User Interactions

### wdio (browser.action for keyboard)
```tsx
import { render } from '@wdio/browser-runner/stencil';

describe('event-re-register', () => {
  it('should handle keyboard events', async () => {
    const elem = document.createElement('event-re-register');
    document.body.appendChild(elem);

    await $('event-re-register').click();
    await browser.action('key').down('a').pause(100).up('a').perform();

    await expect($('event-re-register')).toHaveText(
      expect.stringContaining('Event fired times: 1')
    );
  });
});
```

### @stencil/vitest (userEvent)
```tsx
import { render, h, describe, it, expect } from '@stencil/vitest';
import { userEvent } from 'vitest/browser';

describe('event-re-register', () => {
  it('should handle keyboard events', async () => {
    const { root, waitForChanges } = await render(<event-re-register />);

    root.focus();
    await userEvent.keyboard('a');
    await waitForChanges();

    expect(root).toHaveTextContent('Event fired times: 1');
  });
});
```

### Event Spying
```tsx
import { render, h, describe, it, expect } from '@stencil/vitest';

describe('event-basic', () => {
  it('should spy on custom events', async () => {
    const { root, waitForChanges, spyOnEvent } = await render(<my-component />);
    const eventSpy = spyOnEvent('myEvent');

    root.querySelector('button')!.click();
    await waitForChanges();

    expect(eventSpy).toHaveReceivedEvent();
    expect(eventSpy).toHaveReceivedEventTimes(1);
    expect(eventSpy).toHaveReceivedEventDetail({ value: 'test' });
  });
});
```

## Key Changes

| wdio | @stencil/vitest |
|------|-----------------|
| `render({ template: () => <cmp /> })` in `before()` | `render(<cmp />)` per test |
| `$('.selector')` | `root.querySelector('.selector')` |
| `await $('cmp.hydrated').waitForExist()` | Not needed (render waits) |
| `await $('.something').waitForStable()` | `await waitForStable('.something')` (imported from `@stencil/vitest`) < Not required on first render / on the root *if* the component has a dimensions (a `render()`) |
| `await button.click()` | `button.click()` + `await waitForChanges()` |
| `browser.action('key').down('a').up('a').perform()` | `userEvent.keyboard('a')` |
| `toHaveText()` | `toHaveTextContent()` |
| `toBePresent()` | `toBeTruthy()` or check element exists |
| `document.body.querySelector()` | `root.querySelector()` |
| `await $('async-rerender .loaded').waitForExist();` | `await waitForExist('async-rerender .loaded')` (imported from `@stencil/vitest`) |

If a component has no dimensions (e.g. it doesn't have a `render()` method), you need to skip waiting for the component to be stable / have dimensions on first render. Instead, wait for the existence of the 'hydrated' class on the component's root element. For example:

```tsx
import { render, h, waitForExist } from '@stencil/vitest';

const { root, waitForChanges } = await render(<attribute-complex />, { waitForReady: false });
await waitForExist('attribute-complex.hydrated');
```

## iframes

Tests that use iframes (`setupIFrameTest`, `browser.switchToFrame()`, etc.) are no longer needed. Components run directly in the browser via Playwright.

---

## Migration Status

### Migrated Tests ✅

| wdio test | vitest test |
|-----------|-------------|
| async-rerender | async-rerender |
| attribute-basic | attribute-basic |
| attribute-boolean | attribute-boolean |
| attribute-complex | attribute-complex |
| attribute-deserializer | attribute-deserializer |
| attribute-host | attribute-host |
| attribute-html | attribute-html |
| build-data | build-data |
| child-load-failure | child-load-failure |
| clone-node | clone-node |
| conditional-basic | conditional-basic |
| conditional-rerender | conditional-rerender |
| computed-properties-state-decorator | computed-properties-state-decorator |
| custom-event | custom-event |
| delegates-focus | delegates-focus |
| dom-reattach | dom-reattach |
| event-basic | event-basic |
| event-custom-type | event-custom-type |
| key-reorder | key-reorder |
| lifecycle-basic | lifecycle-basic |
| reflect-to-attr | reflect-to-attr |
| scoped-basic | scoped-basic |
| shadow-dom-basic | shadow-dom-basic |
| slot-basic | slot-basic |
| static-members | static-members |
| svg-attr | svg-attr |
| svg-class | svg-class |
| tag-names | tag-names |
| text-content-patch | text-content-patch |
| watch-native-attributes | watch-native-attributes |
| computed-properties-prop-decorator | computed-properties-prop-decorator |
| computed-properties-watch-decorator | computed-properties-watch-decorator |
| css-variables | css-variables |
| custom-states | custom-states |
| dom-reattach-clone | dom-reattach-clone |
| dynamic-css-variables | dynamic-css-variables |
| es5-addclass-svg | es5-addclass-svg |
| event-listener-capture | event-listener-capture |
| form-associated | form-associated |
| host-attr-override | host-attr-override |
| input-basic | input-basic |
| json-basic | json-basic |
| lifecycle-async | lifecycle-async |
| lifecycle-nested | lifecycle-nested |
| lifecycle-unload | lifecycle-unload |
| lifecycle-update | lifecycle-update |
| listen-jsx | listen-jsx |
| listen-reattach | listen-reattach |
| listen-window | listen-window |
| prefix-attr | prefix-attr |
| prefix-prop | prefix-prop |
| property-serializer | property-serializer |
| ref-attr-order | ref-attr-order |
| reflect-nan-attribute | reflect-nan-attribute |
| reflect-nan-attribute-hyphen | reflect-nan-attribute-hyphen |
| reflect-nan-attribute-with-child | reflect-nan-attribute-with-child |
| reflect-single-render | reflect-single-render |
| remove-child-patch | remove-child-patch |
| radio-group-blur | radio-group-blur |
| reparent-style | reparent-style |
| scoped-add-remove-classes | scoped-add-remove-classes |
| scoped-conditional | scoped-conditional |
| scoped-id-in-nested-classname | scoped-id-in-nested-classname |
| scoped-slot-append-and-prepend | scoped-slot-append-and-prepend |
| scoped-slot-assigned-methods | scoped-slot-assigned-methods |
| scoped-slot-child-insert-adjacent | scoped-slot-child-insert-adjacent |
| scoped-slot-children | scoped-slot-children |
| scoped-slot-connectedcallback | scoped-slot-connectedcallback |
| scoped-slot-content-hide | scoped-slot-content-hide |
| scoped-slot-in-slot | scoped-slot-in-slot |
| scoped-slot-insertbefore | scoped-slot-insertbefore |
| scoped-slot-insertion-order-after-interaction | scoped-slot-insertion-order-after-interaction |
| scoped-slot-slotchange | scoped-slot-slotchange |
| scoped-slot-slotted-parentnode | scoped-slot-slotted-parentnode |
| scoped-slot-text | scoped-slot-text |
| scoped-slot-text-with-sibling | scoped-slot-text-with-sibling |
| shadow-dom-array | shadow-dom-array |
| shadow-dom-mode | shadow-dom-mode |
| shadow-dom-slot-nested | shadow-dom-slot-nested |
| slot-array-basic | slot-array-basic |
| slot-array-top | slot-array-top |
| slot-fallback | slot-fallback |
| slot-html | slot-html |

### Remaining Tests (Not Yet Migrated)

#### Standard Tests (should be migratable)
- shared-jsx
- slot-array-complex
- slot-basic-order
- slot-children
- slot-conditional-rendering
- slot-dynamic-name-change
- slot-dynamic-wrapper
- slot-fallback-with-forwarded-slot
- slot-fallback-with-textnode
- slot-hide-content
- slot-light-dom
- slot-map-order
- slot-nested-default-order
- slot-nested-dynamic
- slot-nested-order
- slot-ng-if
- slot-no-default
- slot-none
- slot-parent-tag-change
- slot-reorder
- slot-replace-wrapper
- slot-scoped-list
- slot-shadow-list
- slotted-css
- static-styles
- stencil-sibling
- template-render
- test-sibling

#### Skipped Tests (need special handling or are not applicable)
- auto-loader (special setup)
- complex-properties (uses SSR renderToString)
- cross-document-constructed-styles (iframes)
- custom-elements-delegates-focus (custom elements output)
- custom-elements-hierarchy-lifecycle (custom elements output)
- custom-elements-output (custom elements output)
- custom-elements-output-tag-class-different (custom elements output)
- declarative-shadow-dom (special SSR)
- dynamic-imports (module loading)
- esm-import (module loading)
- exclude-component (special build config)
- external-imports (module loading)
- global-script (global setup)
- global-styles (global setup)
- image-import (asset imports)
- import-aliasing (module resolution)
- init-css-shim (CSS shim)
- invisible-prehydration (SSR)
- manual-slot-assignment (new slot API)
- no-external-runtime (special build)
- node-resolution (module resolution)
- prerender-test (SSR)
- render (special)
- serialize-deserialize-e2e (SSR)
- ssr-hydration (SSR)
- style-plugin (build config)
- tag-transform (build config)
- test-prerender (SSR)
- ts-target (build config)

