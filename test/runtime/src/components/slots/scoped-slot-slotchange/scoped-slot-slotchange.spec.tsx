import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-slotchange', () => {
  it('checks that internal, stencil content changes fire slotchange events', async () => {
    const { waitForChanges } = await render(
      <scoped-slot-slotchange-wrap>
        <p>My initial slotted content.</p>
      </scoped-slot-slotchange-wrap>,
    );
    await waitForExist('scoped-slot-slotchange-wrap.hydrated');
    const slotChangeEle = document.querySelector('scoped-slot-slotchange') as any;
    expect(slotChangeEle).toBeDefined();
    expect(slotChangeEle.slotEventCatch).toBeDefined();
    expect(slotChangeEle.slotEventCatch).toHaveLength(0);

    document
      .querySelector('scoped-slot-slotchange-wrap')!
      .setAttribute('swap-slot-content', 'true');
    await waitForChanges();
    expect(slotChangeEle.slotEventCatch).toHaveLength(1);
    expect(slotChangeEle.slotEventCatch[0].event.type).toBe('slotchange');
    expect(slotChangeEle.slotEventCatch[0].assignedNodes[0].outerHTML).toMatch(
      '<div class="sc-scoped-slot-slotchange-wrap">Swapped slotted content</div>',
    );
  });

  it('checks that external, browser content changes fire slotchange events', async () => {
    const { waitForChanges } = await render(<scoped-slot-slotchange></scoped-slot-slotchange>);
    await waitForExist('scoped-slot-slotchange.hydrated');

    const slotChangeEle = document.querySelector('scoped-slot-slotchange') as any;

    expect(slotChangeEle).toBeDefined();
    expect(slotChangeEle.slotEventCatch).toHaveLength(0);

    const p = document.createElement('p');
    p.innerHTML = 'Append child content';
    slotChangeEle.appendChild(p);
    await waitForChanges();

    expect(slotChangeEle.slotEventCatch).toHaveLength(1);
    expect(slotChangeEle.slotEventCatch[0].event.type).toBe('slotchange');
    expect(slotChangeEle.slotEventCatch[0].event.target.name).toBeFalsy();
    expect(slotChangeEle.slotEventCatch[0].assignedNodes[0].outerHTML).toMatch(
      `<p>Append child content</p>`,
    );

    const p2 = document.createElement('p');
    p2.innerHTML = 'Fallback content';
    p2.slot = 'fallback-slot';
    slotChangeEle.appendChild(p2);
    await waitForChanges();

    expect(slotChangeEle.slotEventCatch).toHaveLength(2);
    expect(slotChangeEle.slotEventCatch[1].event.type).toBe('slotchange');
    expect(slotChangeEle.slotEventCatch[1].event.target.getAttribute('name')).toBe('fallback-slot');

    const div = document.createElement('div');
    div.innerHTML = 'InsertBefore content';
    slotChangeEle.insertBefore(div, null);
    await waitForChanges();

    expect(slotChangeEle.slotEventCatch).toHaveLength(4);
    expect(slotChangeEle.slotEventCatch[2].event.type).toBe('slotchange');
    expect(slotChangeEle.slotEventCatch[2].assignedNodes[1].outerHTML).toMatch(
      `<div>InsertBefore content</div>`,
    );
  });
});
