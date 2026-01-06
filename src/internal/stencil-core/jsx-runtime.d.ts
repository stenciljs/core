/**
 * Automatic JSX Runtime type definitions for Stencil
 *
 * This module provides TypeScript type definitions for the automatic JSX runtime.
 * When using "jsx": "react-jsx" or "jsx": "react-jsxdev" in tsconfig.json with
 * "jsxImportSource": "@stencil/core", TypeScript will automatically import from
 * these modules instead of requiring manual `h` imports.
 */

import type { VNode, JSXBase } from '../stencil-public-runtime';
import type { JSX as LocalJSX } from '../stencil-public-runtime';

export { Fragment } from '../stencil-public-runtime';

/**
 * JSX runtime function for creating elements in production mode.
 */
export function jsx(type: any, props: any, key?: string): VNode;

/**
 * JSX runtime function for creating elements with static children.
 */
export function jsxs(type: any, props: any, key?: string): VNode;

/**
+ * JSX namespace for TypeScript's automatic JSX runtime.
+ * This is required for TypeScript to resolve JSX element types when using
+ * "jsx": "react-jsx" with "jsxImportSource": "@stencil/core".
+ */
export namespace JSX {
  type BaseElements = LocalJSX.IntrinsicElements & JSXBase.IntrinsicElements;

  export type IntrinsicElements = {
    [K in keyof BaseElements]: BaseElements[K] & { children?: any };
  } & {
    [tagName: string]: any;
  };

  export type Element = VNode | VNode[] | null;
}
