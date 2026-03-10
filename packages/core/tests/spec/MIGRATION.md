# Migrating wdio Tests to @stencil/vitest

- We are migrating from WebDriverIO (wdio) to @stencil/vitest for testing Stencil components. 
- The wdio tests are under `packages/core/tests/wdio` and the new @stencil/vitest tests are under `packages/core/tests/spec`.
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
import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

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
| `await $('cmp').waitForStable()` | Not needed (render waits) |
| `await button.click()` | `button.click()` + `await waitForChanges()` |
| `browser.action('key').down('a').up('a').perform()` | `userEvent.keyboard('a')` |
| `toHaveText()` | `toHaveTextContent()` |
| `toBePresent()` | `toBeTruthy()` or check element exists |
| `document.body.querySelector()` | `root.querySelector()` |
| `await $('async-rerender .loaded').waitForExist();` | `await waitForStable('async-rerender .loaded')` (imported from `@stencil/vitest`) |

## iframes

Tests that use iframes (`setupIFrameTest`, `browser.switchToFrame()`, etc.) are no longer needed. Components run directly in the browser via Playwright.

