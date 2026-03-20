/**
 * Type Tests for Stencil JSX
 *
 * This file validates that Stencil's generated type definitions correctly
 * catch JSX prop type errors at compile time.
 *
 * Usage:
 *   pnpm --filter @tests/type-tests test
 *
 * How it works:
 *   1. `stencil build` generates src/components.d.ts with JSX types
 *   2. `tsc --noEmit` validates this file against those types
 *   3. Lines with @ts-expect-error MUST produce TypeScript errors
 *   4. If they don't, tsc fails with "Unused '@ts-expect-error' directive"
 */
/// <reference path="src/components.d.ts" />
import { h, Fragment } from '@stencil/core';
export function TypeTestComponent() {
    return (h(Fragment, null,
        h("h1", { ariaLabel: "hello" }, "Hello"),
        h("h1", { ariaLabel: 'hello' }, "Hello"),
        h("h1", { ariaLabel: 123 }, "Hello"),
        h("typed-props", { strRequired: "hello", strOptional: "world" }),
        h("typed-props", { strRequired: 'hello' }),
        h("typed-props", { strRequired: 123 }),
        h("typed-props", { strRequired: "ok", strOptional: 456 }),
        h("typed-props", { strRequired: "ok", numOptional: 42 }),
        h("typed-props", { strRequired: "ok", numWithDefault: 100 }),
        h("typed-props", { strRequired: "ok", numOptional: "42" }),
        h("typed-props", { strRequired: "ok", numWithDefault: true }),
        h("typed-props", { strRequired: "ok", boolOptional: true }),
        h("typed-props", { strRequired: "ok", boolWithDefault: false }),
        h("typed-props", { strRequired: "ok", boolOptional: "true" }),
        h("typed-props", { strRequired: "ok", boolWithDefault: 1 }),
        h("typed-props", { strRequired: "ok", unionProp: "small" }),
        h("typed-props", { strRequired: "ok", unionProp: "medium" }),
        h("typed-props", { strRequired: "ok", unionProp: "large" }),
        h("typed-props", { strRequired: "ok", unionProp: "extra-large" }),
        h("typed-props", { strRequired: "ok", objProp: { name: 'test', value: 42 } }),
        h("typed-props", { strRequired: "ok", objProp: { name: 'test' } }),
        h("typed-props", { strRequired: "ok", objProp: { name: 'test', value: '42' } }),
        h("typed-props", { strRequired: "ok", arrProp: ['a', 'b', 'c'] }),
        h("typed-props", { strRequired: "ok", arrProp: [1, 2, 3] })));
}
