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

export function TypeTestComponent() {
  return (
    <>
      {/* ===== HTML Intrinsic Element Type Checks ===== */}

      {/* Valid: string values for string attributes */}
      <h1 ariaLabel='hello'>Hello</h1>
      <h1 ariaLabel={'hello'}>Hello</h1>

      {/* @ts-expect-error - ariaLabel should be string, not number */}
      <h1 ariaLabel={123}>Hello</h1>

      {/* ===== String Prop Type Checks ===== */}

      {/* Valid: string values */}
      <typed-props strRequired='hello' strOptional='world'></typed-props>
      <typed-props strRequired={'hello'}></typed-props>

      {/* @ts-expect-error - strRequired should be string, not number */}
      <typed-props strRequired={123}></typed-props>

      {/* @ts-expect-error - strOptional should be string, not number */}
      <typed-props strRequired='ok' strOptional={456}></typed-props>

      {/* ===== Number Prop Type Checks ===== */}

      {/* Valid: number values */}
      <typed-props strRequired='ok' numOptional={42}></typed-props>
      <typed-props strRequired='ok' numWithDefault={100}></typed-props>

      {/* @ts-expect-error - numOptional should be number, not string */}
      <typed-props strRequired='ok' numOptional='42'></typed-props>

      {/* @ts-expect-error - numWithDefault should be number, not boolean */}
      <typed-props strRequired='ok' numWithDefault={true}></typed-props>

      {/* ===== Boolean Prop Type Checks ===== */}

      {/* Valid: boolean values */}
      <typed-props strRequired='ok' boolOptional={true}></typed-props>
      <typed-props strRequired='ok' boolWithDefault={false}></typed-props>

      {/* @ts-expect-error - boolOptional should be boolean, not string */}
      <typed-props strRequired='ok' boolOptional='true'></typed-props>

      {/* @ts-expect-error - boolWithDefault should be boolean, not number */}
      <typed-props strRequired='ok' boolWithDefault={1}></typed-props>

      {/* ===== Union Type Checks ===== */}

      {/* Valid: one of the union values */}
      <typed-props strRequired='ok' unionProp='small'></typed-props>
      <typed-props strRequired='ok' unionProp='medium'></typed-props>
      <typed-props strRequired='ok' unionProp='large'></typed-props>

      {/* @ts-expect-error - unionProp must be 'small' | 'medium' | 'large' */}
      <typed-props strRequired='ok' unionProp='extra-large'></typed-props>

      {/* ===== Object Prop Type Checks ===== */}

      {/* Valid: correct object shape */}
      <typed-props strRequired='ok' objProp={{ name: 'test', value: 42 }}></typed-props>

      {/* @ts-expect-error - objProp missing required 'value' property */}
      <typed-props strRequired='ok' objProp={{ name: 'test' }}></typed-props>

      {/* @ts-expect-error - objProp.value should be number, not string */}
      <typed-props strRequired='ok' objProp={{ name: 'test', value: '42' }}></typed-props>

      {/* ===== Array Prop Type Checks ===== */}

      {/* Valid: string array */}
      <typed-props strRequired='ok' arrProp={['a', 'b', 'c']}></typed-props>

      {/* @ts-expect-error - arrProp should be string[], not number[] */}
      <typed-props strRequired='ok' arrProp={[1, 2, 3]}></typed-props>
    </>
  );
}
