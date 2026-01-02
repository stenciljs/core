/**
 * Automatic JSX Runtime type definitions for Stencil
 *
 * This module provides TypeScript type definitions for the automatic JSX runtime.
 * When using "jsx": "react-jsx" or "jsx": "react-jsxdev" in tsconfig.json with
 * "jsxImportSource": "@stencil/core", TypeScript will automatically import from
 * these modules instead of requiring manual `h` imports.
 */

import type { VNode } from '../stencil-public-runtime';

export { Fragment } from '../stencil-public-runtime';

/**
 * JSX runtime function for creating elements in production mode.
 */
export function jsx(type: any, props: any, key?: string): VNode;

/**
 * JSX runtime function for creating elements with static children.
 */
export function jsxs(type: any, props: any, key?: string): VNode;
