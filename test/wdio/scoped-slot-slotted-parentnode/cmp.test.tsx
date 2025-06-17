import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('checks slotted node parentNode', () => {
  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <cmp-slotted-parentnode>
          A text node <div>An element</div>
        </cmp-slotted-parentnode>
      ),
    });
    await $('cmp-slotted-parentnode label').waitForExist();
  });

  it('slotted nodes and elements `parentNode` return the actual DOM parent', async () => {
    // After the fix, parentNode should return the actual DOM parent (wrapper element)
    expect((document.querySelector('cmp-slotted-parentnode').children[0].parentNode as Element).tagName).toBe(
      'LABEL',
    );
    expect((document.querySelector('cmp-slotted-parentnode').childNodes[0].parentNode as Element).tagName).toBe(
      'LABEL',
    );
  });

  it('slotted nodes and elements `__parentNode` return component internals', async () => {
    expect((document.querySelector('cmp-slotted-parentnode').children[0] as any).__parentNode.tagName).toBe('LABEL');
    expect((document.querySelector('cmp-slotted-parentnode').childNodes[0] as any).__parentNode.tagName).toBe('LABEL');
  });

  it('should have consistent parentNode and parentElement behavior', async () => {
    const slottedElement = document.querySelector('cmp-slotted-parentnode').children[0];
    const wrapperLabel = document.querySelector('cmp-slotted-parentnode label');

    // Both should reference the same element - the actual DOM parent (wrapper element)
    const parentNodeType = (slottedElement.parentNode as Element)?.tagName;
    const parentElementType = slottedElement.parentElement?.tagName;

    // According to the user's expected behavior, both should return the wrapper element
    expect(slottedElement.parentNode).toBe(wrapperLabel);
    expect(slottedElement.parentElement).toBe(wrapperLabel);

    // Both should be consistent
    expect(slottedElement.parentNode).toBe(slottedElement.parentElement);
    expect(parentNodeType).toBe('LABEL');
    expect(parentElementType).toBe('LABEL');
  });
});
