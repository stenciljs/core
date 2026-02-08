/**
 * Automatic JSX Development Runtime type definitions for Stencil
 *
 * This module provides TypeScript type definitions for the automatic JSX development runtime.
 * When using "jsx": "react-jsxdev" in tsconfig.json with "jsxImportSource": "@stencil/core",
 * TypeScript will automatically import from this module in development mode.
 */

import type { VNode, JSXBase } from '../stencil-public-runtime';
import type { JSX as LocalJSX } from '../stencil-public-runtime';

export { Fragment } from '../stencil-public-runtime';

/**
 * JSX development runtime function for creating elements with debug info.
 */
export function jsxDEV(
  type: any,
  props: any,
  key?: string | number,
  isStaticChildren?: boolean,
  source?: any,
  self?: any,
): VNode;

/**
 * JSX namespace for TypeScript's automatic JSX runtime.
 * This is required for TypeScript to resolve JSX element types when using
 * "jsx": "react-jsxdev" with "jsxImportSource": "@stencil/core".
 */
export namespace JSX {
  type BaseElements = LocalJSX.IntrinsicElements & JSXBase.IntrinsicElements;

  export type IntrinsicElements = {
    [K in keyof BaseElements]: BaseElements[K] & { children?: any };
  } & {
    [tagName: string]: any;
  };

  export type Element = VNode | VNode[] | null;
}
