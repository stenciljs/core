import type * as d from '@stencil/core/internal';
import { NODE_TYPES, parseHtmlToFragment, serializeNodeToHtml } from '@stencil/core/mock-doc';

export function toEqualHtml(input: string | HTMLElement | ShadowRoot, shouldEqual: string) {
  return compareHtml(input, shouldEqual, true);
}

export function toEqualLightHtml(input: string | HTMLElement | ShadowRoot, shouldEqual: string) {
  return compareHtml(input, shouldEqual, false);
}

export function compareHtml(
  input: string | HTMLElement | ShadowRoot,
  shouldEqual: string,
  serializeShadowRoot: d.SerializeDocumentOptions['serializeShadowRoot'],
) {
  if (input == null) {
    throw new Error(`expect toEqualHtml() value is "${input}"`);
  }

  if (typeof (input as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  let serializeA: string;

  if ((input as HTMLElement).nodeType === NODE_TYPES.ELEMENT_NODE) {
    const options = getSpecOptions(input as any);
    serializeA = serializeNodeToHtml(input as any, {
      prettyHtml: true,
      outerHtml: true,
      removeHtmlComments: options.includeAnnotations === false,
      excludeTags: ['body'],
      serializeShadowRoot,
    });
  } else if ((input as HTMLElement).nodeType === NODE_TYPES.DOCUMENT_FRAGMENT_NODE) {
    serializeA = serializeNodeToHtml(input as any, {
      prettyHtml: true,
      excludeTags: ['style'],
      excludeTagContent: ['style'],
      serializeShadowRoot,
    });
  } else if (typeof input === 'string') {
    const parseA = parseHtmlToFragment(input);
    serializeA = serializeNodeToHtml(parseA, {
      prettyHtml: true,
      serializeShadowRoot,
    });
  } else {
    throw new Error(`expect toEqualHtml() value should be an element, shadow root or string.`);
  }

  const parseB = parseHtmlToFragment(shouldEqual);

  const serializeB = serializeNodeToHtml(parseB, {
    prettyHtml: true,
    excludeTags: ['body'],
  });

  if (serializeA !== serializeB) {
    expect(serializeA).toBe(serializeB);
    return {
      message: () => 'HTML does not match',
      pass: false,
    };
  }

  return {
    message: () => 'expect HTML to match',
    pass: true,
  };
}

function getSpecOptions(el: HTMLElement): Partial<d.NewSpecPageOptions> {
  if (el && el.ownerDocument && el.ownerDocument.defaultView) {
    return (el.ownerDocument.defaultView as any)['__stencil_spec_options'] || {};
  }

  return {};
}
