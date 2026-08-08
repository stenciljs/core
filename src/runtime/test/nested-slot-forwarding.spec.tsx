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

  it('routes appendChild()-ed content to the default slot when the forwarding tag has no explicit `slot` attribute', async () => {
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

    const namedSlotDiv = page.doc.querySelector('.named-slot');
    const defaultSlotDiv = page.doc.querySelector('.default-slot');

    expect(defaultSlotDiv.textContent).toContain('initial');
    expect(namedSlotDiv.textContent).not.toContain('initial');

    patchPseudoShadowDom(Object.getPrototypeOf(page.root));

    const appended = page.doc.createElement('span');
    appended.setAttribute('slot', 'named');
    appended.textContent = 'appended';

    page.root.appendChild(appended);
    await page.waitForChanges();

    expect(defaultSlotDiv.textContent).toContain('initial');
    expect(defaultSlotDiv.textContent).toContain('appended');
    expect(namedSlotDiv.textContent).not.toContain('appended');
  });

  it('routes appendChild()-ed content through a forwarding tag with an explicit `slot` attribute (text-node slot ref)', async () => {
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
            <slot name="named" slot="named" />
          </cmp-a>
        );
      }
    }

    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b><span slot="named">initial</span></cmp-b>`,
    });

    const namedSlotDiv = page.doc.querySelector('.named-slot');
    const defaultSlotDiv = page.doc.querySelector('.default-slot');

    patchPseudoShadowDom(Object.getPrototypeOf(page.root));

    const appended = page.doc.createElement('span');
    appended.setAttribute('slot', 'named');
    appended.textContent = 'appended';

    page.root.appendChild(appended);
    await page.waitForChanges();

    expect(namedSlotDiv.textContent).toContain('initial');
    expect(namedSlotDiv.textContent).toContain('appended');
    expect(defaultSlotDiv.textContent).not.toContain('appended');
  });

  it('routes appendChild()-ed content through a forwarding tag with fallback content and an explicit `slot` attribute (element slot-fb ref)', async () => {
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
            <slot name="named" slot="named">
              fallback
            </slot>
          </cmp-a>
        );
      }
    }

    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b><span slot="named">initial</span></cmp-b>`,
    });

    const namedSlotDiv = page.doc.querySelector('.named-slot');
    const defaultSlotDiv = page.doc.querySelector('.default-slot');

    expect(namedSlotDiv.textContent).toContain('initial');
    expect(defaultSlotDiv.querySelector('slot-fb')).toBeNull();

    patchPseudoShadowDom(Object.getPrototypeOf(page.root));

    const appended = page.doc.createElement('span');
    appended.setAttribute('slot', 'named');
    appended.textContent = 'appended';

    page.root.appendChild(appended);
    await page.waitForChanges();

    expect(namedSlotDiv.textContent).toContain('initial');
    expect(namedSlotDiv.textContent).toContain('appended');
    expect(defaultSlotDiv.textContent).not.toContain('appended');
  });

  it('hides content forwarded to a slot name that does not exist anywhere on the target', async () => {
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
            {/* "nonexistent" isn't a slot cmp-a defines at all - not default, not named */}
            <slot name="named" slot="nonexistent" />
          </cmp-a>
        );
      }
    }

    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b><span slot="named">initial</span></cmp-b>`,
    });

    const span = page.doc.querySelector('span[slot="named"]');
    expect(span.hidden).toBe(true);
  });

  it('does not sweep up a directly-authored slot="named" child that just happens to sit near an unrelated forwarding marker', async () => {
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
            {/* directly authored, not forwarded - must be unaffected by the <slot> above */}
            <span slot="named" class="direct-named">
              direct
            </span>
          </cmp-a>
        );
      }
    }

    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-b></cmp-b>`,
    });

    const namedSlotDiv = page.doc.querySelector('.named-slot');
    const defaultSlotDiv = page.doc.querySelector('.default-slot');

    expect(namedSlotDiv.textContent).toContain('direct');
    expect(defaultSlotDiv.textContent).not.toContain('direct');
  });
});
