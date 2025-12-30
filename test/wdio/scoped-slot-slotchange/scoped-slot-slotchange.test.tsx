/// <reference types="expect-webdriverio" />

import { h } from '@stencil/core';
import { render, waitForChanges } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('scoped-slot-slotchange', () => {
  it('checks that internal, stencil content changes fire slotchange events', async () => {
    // @ts-expect-error - no components array?
    render({
      template: () => (
        <scoped-slot-slotchange-wrap>
          <p>My initial slotted content.</p>
        </scoped-slot-slotchange-wrap>
      ),
    });
    await $('scoped-slot-slotchange-wrap div').waitForExist();

    const slotChangeEle: any = document.querySelector('scoped-slot-slotchange');
    await expect(slotChangeEle).toBeDefined();
    await expect(slotChangeEle.slotEventCatch).toBeDefined();
    await expect(slotChangeEle.slotEventCatch).toHaveLength(1);
    await expect(slotChangeEle.slotEventCatch[0]).toMatchObject({ event: { type: 'slotchange' } });
    await expect(slotChangeEle.slotEventCatch[0].assignedNodes[0].outerHTML).toMatch(
      `<p class="sc-scoped-slot-slotchange-wrap">Initial slotted content</p>`,
    );

    document.querySelector('scoped-slot-slotchange-wrap').setAttribute('swap-slot-content', 'true');
    await waitForChanges();
    await expect(slotChangeEle.slotEventCatch).toHaveLength(2);
    await expect(slotChangeEle.slotEventCatch[1]).toMatchObject({ event: { type: 'slotchange' } });
    await expect(slotChangeEle.slotEventCatch[1].assignedNodes[0].outerHTML).toMatch(
      '<div class="sc-scoped-slot-slotchange-wrap">Swapped slotted content</div>',
    );
  });

  it('checks that external, browser content changes fire slotchange events', async () => {
    // @ts-expect-error - no components array?
    render({
      template: () => <scoped-slot-slotchange></scoped-slot-slotchange>,
    });
    await $('scoped-slot-slotchange div').waitForExist();
    const slotChangeEle: any = document.querySelector('scoped-slot-slotchange');

    await expect(slotChangeEle).toBeDefined();
    await expect(slotChangeEle.slotEventCatch).toHaveLength(0);

    const p = document.createElement('p');
    p.innerHTML = 'Append child content';
    slotChangeEle.appendChild(p);
    await waitForChanges();

    await expect(slotChangeEle.slotEventCatch).toHaveLength(1);
    await expect(slotChangeEle.slotEventCatch[0]).toMatchObject({ event: { type: 'slotchange' } });
    await expect(slotChangeEle.slotEventCatch[0].event.target.name).toBeFalsy();
    await expect(slotChangeEle.slotEventCatch[0].assignedNodes[0].outerHTML).toMatch(`<p>Append child content</p>`);

    const p2 = document.createElement('p');
    p2.innerHTML = 'Fallback content';
    p2.slot = 'fallback-slot';
    slotChangeEle.appendChild(p2);
    await waitForChanges();

    await expect(slotChangeEle.slotEventCatch).toHaveLength(2);
    await expect(slotChangeEle.slotEventCatch[1]).toMatchObject({ event: { type: 'slotchange' } });
    await expect(slotChangeEle.slotEventCatch[1].event.target.getAttribute('name')).toBe('fallback-slot');

    const div = document.createElement('div');
    div.innerHTML = 'InsertBefore content';
    slotChangeEle.insertBefore(div, null);
    await waitForChanges();

    await expect(slotChangeEle.slotEventCatch).toHaveLength(4);
    await expect(slotChangeEle.slotEventCatch[2]).toMatchObject({ event: { type: 'slotchange' } });
    await expect(slotChangeEle.slotEventCatch[2].assignedNodes[1].outerHTML).toMatch(`<div>InsertBefore content</div>`);
  });
});
