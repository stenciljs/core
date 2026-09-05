import { h } from './h';

export function jsx(type: any, props: any, key?: string) {
  const { children, ...rest } = props ?? {};

  if (key !== undefined && !('key' in rest)) {
    rest.key = key;
  }

  const attrs = hasKeys(rest) ? rest : null;

  if (children !== undefined) {
    return Array.isArray(children) ? h(type, attrs, ...children) : h(type, attrs, children);
  }
  return h(type, attrs);
}

/**
 * @alias
 */
export const jsxs = jsx;

/**
 * @alias
 */
export const jsxDEV = jsx;

function hasKeys(obj: object) {
  for (const _ in obj) return true;
  return false;
}
