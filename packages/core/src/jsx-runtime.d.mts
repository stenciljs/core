import type { VNode, JSXBase, JSX as LocalJSX } from './declarations/stencil-public-runtime';

export { Fragment } from './declarations/stencil-public-runtime';
export function jsx(type: any, props: any, key?: string): VNode;
export function jsxs(type: any, props: any, key?: string): VNode;
export function jsxDEV(type: any, props: any, key?: string): VNode;

export namespace JSX {
  type BaseElements = LocalJSX.IntrinsicElements & JSXBase.IntrinsicElements;

  export type IntrinsicElements = {
    [K in keyof BaseElements]: BaseElements[K] & { children?: any };
  } & {
    [tagName: string]: any;
  };

  export type Element = VNode;
}
