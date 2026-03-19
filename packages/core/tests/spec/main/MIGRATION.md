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
import { Fragment } from '@stencil/core';

describe('attribute-basic', () => {
  it('button click rerenders', async () => {
    const { root, waitForChanges } = await render(<attribute-basic-root />);
    await waitForExist('attribute-basic-root.hydrated');
    
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
import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';
import { userEvent } from 'vitest/browser';

describe('event-re-register', () => {
  it('should handle keyboard events', async () => {
    const { root, waitForChanges } = await render(<event-re-register />);
    await waitForExist('event-re-register.hydrated');

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

If a component has no dimensions (e.g. it doesn't have a `render()` method), or `root` is not the actual component you're testing, you need to skip waiting for the component to be stable / have dimensions on first render. Instead, wait for the existence of the 'hydrated' class on the component's root element. For example:

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
| shared-jsx | shared-jsx |
| slot-array-complex | slot-array-complex |
| slot-basic-order | slot-basic-order |
| slot-children | slot-children |
| slot-conditional-rendering | slot-conditional-rendering |
| slot-dynamic-name-change | slot-dynamic-name-change |
| slot-dynamic-wrapper | slot-dynamic-wrapper |
| slot-fallback-with-forwarded-slot | slot-fallback-with-forwarded-slot |
| slot-fallback-with-textnode | slot-fallback-with-textnode |
| slot-hide-content | slot-hide-content |
| slot-light-dom | slot-light-dom |
| slot-map-order | slot-map-order |
| slot-nested-default-order | slot-nested-default-order |
| slot-nested-dynamic | slot-nested-dynamic |
| slot-nested-order | slot-nested-order |
| slot-no-default | slot-no-default |
| slot-none | slot-none |
| slot-parent-tag-change | slot-parent-tag-change |
| slot-reorder | slot-reorder |
| slot-replace-wrapper | slot-replace-wrapper |
| slot-scoped-list | slot-scoped-list |
| slot-shadow-list | slot-shadow-list |
| slotted-css | slotted-css |
| static-styles | static-styles |
| stencil-sibling | stencil-sibling |
| template-render | template-render |
| cross-document-constructed-styles | cross-document-constructed-styles |
| dynamic-imports | dynamic-imports |
| external-imports | external-imports |
| global-script | global-script |
| global-styles | global-styles |
| image-import | image-import |
| import-aliasing | import-aliasing |
| init-css-shim | css-url-paths |
| manual-slot-assignment | manual-slot-assignment |
| node-resolution | node-resolution |
| esm-import | component-on-ready |
| exclude-component | exclude-component |
| style-plugin | style-plugin |
| tag-transform | tag-transform |
| sibling-spec | new project setup in spec/sibling |
| no-external-runtime | migrated to `spec/external-runtime` (tests `externalRuntime: true` build) |

### ts-target Tests (Pending Migration)

These tests verify component class inheritance patterns. Previously required es2022 target and iframe isolation for testing both `dist` and `dist-custom-elements` outputs. Now these can run directly via vitest projects.

| wdio test | vitest test | status |
|-----------|-------------|--------|
| ts-target/extends-abstract | extends-abstract | ✅ done |
| ts-target/extends-cmp | extends-cmp | ✅ done |
| ts-target/extends-composition-scaling | extends-composition-scaling | ✅ done |
| ts-target/extends-conflicts | extends-conflicts | ✅ done |
| ts-target/extends-controller-updates | extends-controller-updates | ✅ done |
| ts-target/extends-direct-state | extends-direct-state | ✅ done |
| ts-target/extends-events | extends-events | ✅ done |
| ts-target/extends-external | extends-external | ✅ done |
| ts-target/extends-inheritance-scaling | extends-inheritance-scaling | ✅ done |
| ts-target/extends-lifecycle-basic | extends-lifecycle-basic | ✅ done |
| ts-target/extends-lifecycle-multilevel | extends-lifecycle-multilevel | ✅ done |
| ts-target/extends-local | extends-local | ✅ done |
| ts-target/extends-methods | extends-methods | ✅ done |
| ts-target/extends-mixed-decorators | extends-mixed-decorators | ✅ done |
| ts-target/extends-mixin | extends-mixin | ✅ done |
| ts-target/extends-props-state | extends-props-state | ✅ done |
| ts-target/extends-render | extends-render | ✅ done |
| ts-target/extends-via-host | extends-via-host | ✅ done |
| ts-target/extends-external-abstract | extends-external-abstract | ✅ done |
| ts-target/extends-external-with-mixin | extends-external-with-mixin | ✅ done |
| ts-target/extends-mixin-slot | extends-mixin-slot | ✅ done |
| ts-target/extends-watch | extends-watch | ✅ done |

### SSR Tests (migrated to tests/end-to-end)

These tests use `renderToString` / `hydrateDocument` and have been migrated to Playwright e2e tests.

| wdio test | e2e location | status |
|-----------|--------------|--------|
| complex-properties | `ssr-complex-properties` | ✅ done |
| declarative-shadow-dom | `ssr-declarative-shadow-dom` | ✅ done (already existed, renamed) |
| serialize-deserialize-e2e | `ssr-serialize-deserialize` | ✅ done |
| ssr-hydration | `ssr-hydration` | ✅ done |
| scoped-hydration | `ssr-scoped-hydration` | ✅ done (already existed, renamed) |

### Config Option Tests (pending - require isolated mini-projects)

These tests require their own `stencil.config.ts` to test specific build configurations.

| wdio test | destination | notes |
|-----------|-------------|-------|
| invisible-prehydration | `config/invisible-prehydration/` | Tests `invisiblePrehydration: false` config (client-side hydration CSS behavior) |
| prerender-test + test-prerender | `config/prerender/` | Tests prerender with `prerenderConfig` |

---

# Test Directory Reorganization

> **Status:** Planning - this section outlines the proposed reorganization of the test directory structure.

## Current Problems

1. **Chaotic organization** - 18+ top-level directories with unclear boundaries
2. **Naming inconsistency** - `.test.tsx` vs `.spec.tsx` vs `.e2e.ts`
3. **Redundancy** - Some functionality tested in multiple places (wdio, spec, end-to-end)
4. **wdio is legacy** - Being migrated away but still contains 142 directories
5. **Mixed concerns** - Sample apps, fixtures, and tests all in same directory
6. **Flat structure** - 130+ component tests in spec/main with no categorization

## Proposed Structure

```
tests/
├── fixtures/                  # Reference apps + shared fixtures
│   ├── hello-world/           # Bundle size reference
│   ├── hello-vdom/            # Bundle size reference
│   ├── todo-app/              # Bundle size reference
│   ├── ionic-app/             # Integration validation
│   └── sibling/               # Component fixture imported by runtime tests
│
├── unit/                      # Pure unit tests (no Stencil compilation)
│   ├── copy-task/
│   └── type-tests/
│
├── runtime/                   # Component runtime behavior (vitest)
│   ├── stencil.config.ts      # Shared config for all runtime tests
│   ├── vitest.config.ts
│   └── src/
│       ├── attributes/        # attribute-basic, attribute-boolean, etc.
│       ├── events/            # event-basic, listen-*, custom-event, etc.
│       ├── lifecycle/         # lifecycle-basic, lifecycle-async, etc.
│       ├── slots/             # slot-basic, slot-nested-*, etc.
│       ├── shadow-dom/        # shadow-dom-basic, delegates-focus, etc.
│       ├── scoped/            # scoped-basic, scoped-slot-*, etc.
│       ├── rendering/         # async-rerender, conditional-*, key-reorder, etc.
│       ├── state/             # computed-properties-*, reflect-*, watch-*, etc.
│       ├── forms/             # form-associated, input-basic
│       ├── inheritance/       # extends-*, mixin-*
│       ├── dom/               # dom-reattach, clone-node, text-content-patch, etc.
│       └── misc/              # Other one-offs
│
├── ssr/                       # Server-side rendering tests (playwright)
│   ├── stencil.config.ts      # Needs dist-hydrate-script output
│   ├── playwright.config.ts
│   └── src/
│       ├── declarative-shadow-dom/
│       ├── scoped/
│       ├── serialize/
│       ├── complex-properties/
│       └── ...
│
├── config/                    # Config option tests (each has own stencil.config.ts)
│   ├── external-runtime/      # externalRuntime: true
│   ├── invisible-prehydration/# invisiblePrehydration: false
│   ├── prerender/             # prerenderConfig
│   ├── prerender-shadow/      # Shadow DOM + prerender
│   └── style-modes/           # Style mode testing
│
├── build/                     # Build output/tooling tests
│   ├── bundle-size/           # Bundle size validation
│   ├── bundler/               # Vite bundling tests
│   ├── docs-json/             # JSON docs generation
│   └── docs-readme/           # README docs generation
│
└── perf/                      # Performance benchmarks
    ├── runtime-benchmark/
    └── performance/
```

## Category Definitions

### `fixtures/`
Reference applications and shared component fixtures. NOT tests themselves.
- **hello-world, hello-vdom, todo-app** - Bundle size baselines
- **ionic-app** - Integration validation with real Ionic components
- **sibling** - Component fixture imported by runtime/inheritance tests

### `unit/`
Pure unit tests that don't require Stencil compilation.
- **copy-task** - Tests copy task utilities
- **type-tests** - TypeScript type validation

### `runtime/`
Component runtime behavior tests using `@stencil/vitest`. All tests share one `stencil.config.ts`.

Components are organized by feature area:
- **attributes/** - Attribute binding, reflection, serialization
- **events/** - Event emission, listeners, capturing
- **lifecycle/** - Component lifecycle hooks
- **slots/** - Slot behavior (basic, named, nested, fallback)
- **shadow-dom/** - Shadow DOM specific behavior
- **scoped/** - Scoped CSS behavior
- **rendering/** - Re-rendering, conditional rendering, keyed lists
- **state/** - @State, @Prop, @Watch, computed properties
- **forms/** - Form-associated custom elements
- **inheritance/** - Component extension patterns (extends-*, mixins)
- **dom/** - DOM API patches, node manipulation
- **misc/** - Tests that don't fit elsewhere

### `ssr/`
Server-side rendering tests using `renderToString()` + Playwright.

These tests:
1. Call `renderToString()` to generate HTML server-side
2. Load that HTML into a browser via Playwright
3. Verify client-side rehydration behavior

Requires `dist-hydrate-script` output target.

### `config/`
Tests for specific Stencil config options. Each subdirectory has its own `stencil.config.ts` because the config option itself is what's being tested.

| Directory | Config Option | What it tests |
|-----------|---------------|---------------|
| external-runtime/ | `externalRuntime: true` | External runtime bundling |
| invisible-prehydration/ | `invisiblePrehydration: false` | Client-side hydration CSS behavior |
| prerender/ | `prerenderConfig` | Build-time prerendering |
| prerender-shadow/ | Shadow DOM + prerender | Prerender with shadow DOM |
| style-modes/ | Style modes | Style mode switching |

### `build/`
Tests for build outputs and tooling integration.
- **bundle-size/** - Validates bundle sizes haven't regressed
- **bundler/** - Vite integration tests
- **docs-json/** - JSON documentation generation
- **docs-readme/** - README documentation generation

### `perf/`
Performance benchmarks.
- **runtime-benchmark/** - Runtime performance
- **performance/** - General performance tests

---

## End-to-End Audit

The current `end-to-end/` directory contains a mix of:
1. **SSR tests** (ssr-*) → Move to `ssr/`
2. **Component behavior tests** (car-list, dom-api, etc.) → Audit for redundancy

### Audit Needed

For each non-SSR test in end-to-end, determine:
- Is this functionality already covered in runtime tests? → **Delete**
- Is this testing unique functionality? → **Migrate to runtime/**
- Does this specifically need the e2e build validation? → **Keep**

| e2e test | status | action | notes |
|----------|--------|--------|-------|
| **SSR Tests** ||||
| ssr-complex-properties | SSR | → `ssr/` | |
| ssr-declarative-shadow-dom | SSR | → `ssr/` | |
| ssr-hydration | SSR | → `ssr/` | |
| ssr-scoped-hydration | SSR | → `ssr/` | |
| ssr-serialize-deserialize | SSR | → `ssr/` | |
| ssr-runtime-decorators | SSR | → `ssr/` | |
| hydrate-props | SSR | → `ssr/` | |
| prerender-cmp | SSR | → `ssr/` | |
| **REDUNDANT - Delete** ||||
| build-data | ✅ redundant | **delete** | Covered by `build-data.spec.tsx` |
| event-cmp | ✅ redundant | **delete** | Covered by `event-basic.spec.tsx`, `custom-event.spec.tsx` |
| listen-cmp | ✅ redundant | **delete** | Covered by `listen-jsx.spec.tsx` |
| method-cmp | ✅ redundant | **delete** | Covered by `extends-methods.spec.tsx` |
| prop-cmp | ✅ redundant | **delete** | Covered by `attribute-basic.spec.tsx`, `computed-properties-prop-decorator.spec.tsx` |
| slot-cmp | ✅ redundant | **delete** | Covered by 50+ slot runtime tests |
| slot-cmp-container | ✅ redundant | **delete** | Covered by slot runtime tests |
| slot-parent-cmp | ✅ redundant | **delete** | Covered by slot runtime tests |
| state-cmp | ✅ redundant | **delete** | Covered by `computed-properties-state-decorator.spec.tsx` |
| **UNIQUE - Migrate to runtime/** ||||
| car-list + car-detail | unique | → `runtime/` | Complex component composition with nested shadow DOM |
| dom-api | unique | → `runtime/dom/` | DOM manipulation patterns (classList, attributes, innerHTML) |
| dom-interaction | unique | → `runtime/dom/` | User interaction (click, focus, keyboard) |
| dom-visible | unique | → `runtime/dom/` | Visibility state and async patterns |
| element-cmp | unique | → `runtime/misc/` | @Element decorator usage |
| env-data | unique | → `runtime/misc/` | Environment variable injection |
| non-existent-element | unique | → `runtime/dom/` | Edge case: querying non-existent elements |
| resolve-var-events | unique | → `runtime/events/` | Event resolution via variables |
| path-alias-cmp | unique | → `runtime/misc/` | TypeScript path alias imports |
| **BUILD-SPECIFIC - Keep** ||||
| app-root | build | **keep** | Tests hydration flags, global styles - build output validation |
| deep-selector | build | **keep** | Validates Playwright shadow DOM piercing |
| import-assets | build | **keep** | Tests build-time asset handling (text, HTML, SVG, base64) |
| miscellaneous | build | **keep** | Tests build-time style ordering |

### Value of end-to-end Project

Even after migrating tests, the end-to-end project has value as a **complex build validation**:
- Its `stencil.config.ts` has rollup plugins, multiple output targets, react output target, etc.
- Validates that Stencil can compile a "gnarly" real-world config
- May not need individual component tests if runtime coverage is sufficient

---

## Migration Plan

### Phase 1: Structure Setup
- [ ] Create new directory structure
- [ ] Move fixtures (hello-world, etc.) to `fixtures/`
- [ ] Move copy-task, type-tests to `unit/`
- [ ] Rename spec/main → runtime/ (or reorganize in place)

### Phase 2: Runtime Organization
- [ ] Organize runtime tests into feature subdirectories
- [ ] Update imports if needed
- [ ] Verify all tests still pass

### Phase 3: SSR Tests
- [ ] Create `ssr/` directory with proper config
- [ ] Move ssr-* tests from end-to-end
- [ ] Verify SSR tests pass

### Phase 4: Config Option Tests
- [ ] Migrate invisible-prehydration from wdio → `config/`
- [ ] Migrate prerender-test from wdio → `config/`
- [ ] Move external-runtime, prerender-shadow, style-modes to `config/`

### Phase 5: End-to-End Audit
- [ ] Audit each non-SSR test for redundancy
- [ ] Delete redundant tests
- [ ] Migrate unique tests to runtime/
- [ ] Decide fate of end-to-end project (keep as build validation or remove)

### Phase 6: Cleanup
- [ ] Delete wdio/ directory
- [ ] Update documentation
- [ ] Update CI/scripts

---

## File Extension Conventions

| Location | Test Extension | Rationale |
|----------|----------------|-----------|
| runtime/ | `.spec.tsx` | @stencil/vitest convention |
| ssr/ | `.e2e.ts` | @stencil/playwright convention |
| config/*/ | `.spec.tsx` or `.e2e.ts` | Depends on test runner used |
| unit/ | `.spec.ts` | Standard vitest |

---

## Open Questions

1. **sibling/** - Currently in spec/sibling with its own stencil.config.ts. Should it move to fixtures/ and have runtime tests import from there?

2. **perf/** - Are runtime-benchmark and performance actively used? Should they stay separate or consolidate?

3. **end-to-end as build validation** - After migrating tests out, should we keep a minimal end-to-end project just to validate the complex stencil.config.ts compiles?

