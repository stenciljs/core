import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { patchPseudoShadowDom } from '../dom-extras';

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

  it('routes appendChild()-ed content through a forwarded named slot (text-node slot ref)', async () => {
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

  it('routes initial content through a forwarded named slot that has fallback content (element slot-fb ref)', async () => {
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
            <slot name="named">fallback</slot>
          </cmp-a>
        );
      }
    }

    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b><span slot="named">initial</span></cmp-b>`,
    });

    const namedSlotDiv = page.root.querySelector('.named-slot');
    const defaultSlotDiv = page.root.querySelector('.default-slot');

    expect(namedSlotDiv.textContent).toContain('initial');
    expect(defaultSlotDiv.textContent).not.toContain('initial');
    expect(defaultSlotDiv.querySelector('slot-fb')).toBeNull();
  });
});
