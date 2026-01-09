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
  const propsObj = props || {};
  const { children, ...rest } = propsObj;

  // Build vnodeData - key from props takes precedence over parameter
  let vnodeData = rest;
  if (key !== undefined && !('key' in rest)) {
    vnodeData = { ...rest, key };
  }

  // If vnodeData is empty object, use null instead (matches old transform)
  if (vnodeData && Object.keys(vnodeData).length === 0) {
    vnodeData = null;
  }

  // Note: source and self are debug info we could potentially use in the future
  // for better developer experience, but for now we ignore them

  if (children !== undefined) {
    // If children is already an array, spread it
    if (Array.isArray(children)) {
      return h(type, vnodeData, ...children);
    }
    // If single child is a VNode (has $flags$), pass it directly
    // Otherwise it gets stringified
    if (typeof children === 'object' && children !== null && '$flags$' in children) {
      return h(type, vnodeData, children);
    }
    // For primitive values (strings, numbers), pass directly
    return h(type, vnodeData, children);
  }

  return h(type, vnodeData);
}
