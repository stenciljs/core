/**
 * Automatic JSX Development Runtime for Stencil
 *
 * This module provides the automatic JSX runtime functions required by
 * TypeScript when using "jsx": "react-jsxdev" mode. This is used during
 * development and includes additional debugging information.
 *
 * For more information, see:
 * https://www.typescriptlang.org/docs/handbook/jsx.html
 */

import { h } from './h';

export { Fragment } from '../fragment';

/**
 * JSX development runtime function for creating elements with debug info.
 * Called by TypeScript's jsx transform in development mode.
 *
 * @param type - The element type (string tag name or functional component)
 * @param props - The element props (includes children, key, etc.)
 * @param key - The element's key (passed separately in dev mode)
 * @param isStaticChildren - Whether children are static (optimization hint)
 * @param source - Source location information for debugging
 * @param self - The component instance (for debugging)
 * @returns A virtual DOM node
 */
export function jsxDEV(
  type: any,
  props: any,
  key?: string | number,
  _isStaticChildren?: boolean,
  _source?: any,
  _self?: any,
) {
  const { children, ...rest } = props;

  // In development mode, key might be passed separately
  const vnodeData = key !== undefined ? { ...rest, key } : rest;

  // Note: source and self are debug info we could potentially use in the future
  // for better developer experience, but for now we ignore them

  // If children is an array, spread it; otherwise pass as single child
  if (Array.isArray(children)) {
    return h(type, vnodeData, ...children);
  } else if (children !== undefined) {
    return h(type, vnodeData, children);
  }

  return h(type, vnodeData);
}
