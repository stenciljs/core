import { MockNode, serializeNodeToHtml } from '@stencil/core/mock-doc';

const print = (val: unknown): string => {
  // we coerce here because Jest wants `val` to be unknown
  return serializeNodeToHtml(val as MockNode | Node, {
    serializeShadowRoot: true,
    prettyHtml: true,
    outerHtml: true,
  });
};

const test = (val: any): boolean => {
  return val !== undefined && val !== null && (val instanceof HTMLElement || val instanceof MockNode);
};

export const HtmlSerializer = {
  print,
  test,
};
