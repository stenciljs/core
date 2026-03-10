# Migrating wdio Tests to @stencil/vitest

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

## iframes

Tests that use iframes (`setupIFrameTest`, `browser.switchToFrame()`, etc.) are no longer needed. Components run directly in the browser via Playwright.

## File Naming

Use explicit, descriptive names:
- Component: `event-basic.tsx`
- Test: `event-basic.spec.tsx`

NOT: `cmp.tsx` / `cmp.test.tsx`

## Running Tests

```bash
pnpm test                  # Both outputs
pnpm test:dist             # dist (lazy) only
pnpm test:custom-elements  # custom-elements only
```

Add `--browser.headless=false` for headed mode, `--watch` for watch mode.
