/**
 * Automatic JSX Development Runtime type definitions for Stencil
 *
 * This module provides TypeScript type definitions for the automatic JSX development runtime.
 * When using "jsx": "react-jsxdev" in tsconfig.json with "jsxImportSource": "@stencil/core",
 * TypeScript will automatically import from this module in development mode.
 */

import type { VNode } from '../stencil-public-runtime';

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
