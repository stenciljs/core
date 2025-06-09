import { NODE_TYPES } from '@stencil/core/mock-doc';

export function toEqualText(input: HTMLElement | string, expectTextContent: string) {
  if (input == null) {
    throw new Error(`expect toEqualText() value is "${input}"`);
  }

  if (typeof (input as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  let textContent: string;

  if ((input as HTMLElement).nodeType === NODE_TYPES.ELEMENT_NODE) {
    textContent = ((input as HTMLElement).textContent ?? '').replace(/\s\s+/g, ' ').trim();
  } else {
    textContent = String(input).replace(/\s\s+/g, ' ').trim();
  }

  if (typeof expectTextContent === 'string') {
    expectTextContent = expectTextContent.replace(/\s\s+/g, ' ').trim();
  }

  const pass = textContent === expectTextContent;

  return {
    message: () => `expected textContent "${expectTextContent}" to ${pass ? 'not ' : ''}equal "${textContent}"`,
    pass: pass,
  };
}
