import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { patchPseudoShadowDom } from '../dom-extras';

/**
 * Regression test for https://github.com/stenciljs/core/issues/6770
 *
 * `cmp-b` forwards a named `<slot>` into nested `cmp-a`: `<cmp-a><slot name="named" /></cmp-a>`,
 * where `cmp-a` also defines a slot named "named". Content assigned to `cmp-b`'s "named" slot
 * must cascade into `cmp-a`'s "named" slot - for content already present on connect and for
 * content added later via `appendChild`.
 */
describe('nested named slot forwarding', () => {
  @Component({
    tag: 'cmp-a',
    shadow: false,
    scoped: true,
  })
  class CmpA {
    render() {
      return (
        <div class="cmp-a-outer">
          <div class="default-slot">
            <slot />
          </div>
          <div class="named-slot">
            <slot name="named" />
          </div>
        </div>
      );
    }
  }

  @Component({
    tag: 'cmp-b',
    shadow: false,
    scoped: true,
  })
  class CmpB {
    render() {
      return (
        <cmp-a>
          <slot />
          <slot name="named" />
        </cmp-a>
      );
    }
  }

  it('routes initial content into the forwarded named slot', async () => {
    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b><span slot="named">initial</span></cmp-b>`,
    });

    const namedSlotDiv = page.doc.querySelector('.named-slot');
    const defaultSlotDiv = page.doc.querySelector('.default-slot');

    expect(namedSlotDiv.textContent).toContain('initial');
    expect(defaultSlotDiv.textContent).not.toContain('initial');
  });

  it('routes appendChild()-ed content into the forwarded named slot', async () => {
    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b><span slot="named">initial</span></cmp-b>`,
    });

    const cmpAEl = page.doc.querySelector('cmp-a');
    const namedSlotDiv = page.doc.querySelector('.named-slot');
    const defaultSlotDiv = page.doc.querySelector('.default-slot');

    patchPseudoShadowDom(Object.getPrototypeOf(page.root));
    patchPseudoShadowDom(Object.getPrototypeOf(cmpAEl));

    const appended = page.doc.createElement('span');
    appended.setAttribute('slot', 'named');
    appended.textContent = 'appended';

    page.root.appendChild(appended);
    await page.waitForChanges();

    expect(namedSlotDiv.textContent).toContain('initial');
    expect(namedSlotDiv.textContent).toContain('appended');
    expect(defaultSlotDiv.textContent).not.toContain('appended');
  });
});
