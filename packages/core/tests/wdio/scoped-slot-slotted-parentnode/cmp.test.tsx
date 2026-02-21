import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('checks slotted node parentNode', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <cmp-slotted-parentnode>
          A text node <div>An element</div>
        </cmp-slotted-parentnode>
      ),
    });
    await $('cmp-slotted-parentnode label').waitForExist();
  });

  it('slotted nodes and elements `parentNode` do not return component internals', async () => {
    expect((document.querySelector('cmp-slotted-parentnode').children[0].parentNode as Element).tagName).toBe(
      'CMP-SLOTTED-PARENTNODE',
    );
    expect((document.querySelector('cmp-slotted-parentnode').childNodes[0].parentNode as Element).tagName).toBe(
      'CMP-SLOTTED-PARENTNODE',
    );
  });

  it('slotted nodes and elements `__parentNode` return component internals', async () => {
    expect((document.querySelector('cmp-slotted-parentnode').children[0] as any).__parentNode.tagName).toBe('LABEL');
    expect((document.querySelector('cmp-slotted-parentnode').childNodes[0] as any).__parentNode.tagName).toBe('LABEL');
  });
});
