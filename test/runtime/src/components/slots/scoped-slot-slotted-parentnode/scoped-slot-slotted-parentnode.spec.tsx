import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('checks slotted node parentNode', () => {
  it('slotted nodes and elements `parentNode` do not return component internals', async () => {
    await render(
      <cmp-slotted-parentnode>
        A text node <div>An element</div>
      </cmp-slotted-parentnode>,
    );
    await waitForExist('cmp-slotted-parentnode.hydrated');

    expect(
      (document.querySelector('cmp-slotted-parentnode')!.children[0].parentNode as Element).tagName,
    ).toBe('CMP-SLOTTED-PARENTNODE');
    expect(
      (document.querySelector('cmp-slotted-parentnode')!.childNodes[0].parentNode as Element)
        .tagName,
    ).toBe('CMP-SLOTTED-PARENTNODE');
  });

  it('slotted nodes and elements `__parentNode` return component internals', async () => {
    const { root } = await render(
      <cmp-slotted-parentnode>
        A text node <div>An element</div>
      </cmp-slotted-parentnode>,
    );
    await waitForExist('cmp-slotted-parentnode.hydrated');

    expect(
      (document.querySelector('cmp-slotted-parentnode')!.children[0] as any).__parentNode.tagName,
    ).toBe('LABEL');
    expect(
      (document.querySelector('cmp-slotted-parentnode')!.childNodes[0] as any).__parentNode.tagName,
    ).toBe('LABEL');
  });
});
