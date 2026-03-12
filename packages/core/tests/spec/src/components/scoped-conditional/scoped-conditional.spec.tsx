import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-conditional', () => {
  it('renders the initial slotted content', async () => {
    await render(
      <scoped-conditional>
        <div>This div will be slotted in</div>
      </scoped-conditional>,
    );

    const host = document.querySelector('scoped-conditional')!;
    const innerDiv = host.querySelector('div')!;
    expect(innerDiv.textContent).toBe(`before slot->This div will be slotted in<-after slot`);
  });

  it('renders the slotted content after toggling the message', async () => {
    const { waitForChanges } = await render(
      <scoped-conditional>
        <div>This div will be slotted in</div>
      </scoped-conditional>,
    );

    const host = document.querySelector('scoped-conditional') as any;
    // toggle the 'Hello' message, which should insert a new <div/> into the DOM & _not_ remove the slotted content
    host.renderHello = true;
    await waitForChanges();

    const outerDivChildren = host.querySelector('div')!.childNodes;
    expect(outerDivChildren.length).toBe(2);
    expect(outerDivChildren[0].textContent).toBe('Hello');
    expect(outerDivChildren[1].textContent).toBe(`before slot->This div will be slotted in<-after slot`);
  });

  it('renders the slotted content after toggling the message twice', async () => {
    const { waitForChanges } = await render(
      <scoped-conditional>
        <div>This div will be slotted in</div>
      </scoped-conditional>,
    );

    const host = document.querySelector('scoped-conditional') as any;
    // toggle the 'Hello' message twice, which should insert a new <div/> into the DOM, then remove it.
    // as a result of the toggle, we should _not_ remove the slotted content
    host.renderHello = true;
    await waitForChanges();
    host.renderHello = false;
    await waitForChanges();

    const innerDiv = host.querySelector('div')!;
    expect(innerDiv.textContent).toBe(`before slot->This div will be slotted in<-after slot`);
  });
});
