import { Component, h, Host } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import type * as d from '../../declarations';
import { initializeClientHydrate } from '../client-hydrate';

describe('initializeClientHydrate', () => {
  describe.each(['', 'named'])('nested shadow component in the "%s" slot', (slotName) => {
    it.each(['child-first', 'parent-first'])('preserves light DOM order when hydrating %s', async (order) => {
      @Component({ tag: 'cmp-a', shadow: true })
      class CmpA {
        render() {
          return (
            <main>
              <slot />
              <slot name="named" />
            </main>
          );
        }
      }

      @Component({ tag: 'cmp-b', shadow: true })
      class CmpB {
        render() {
          return <span>Child content</span>;
        }
      }

      const server = await newSpecPage({
        components: [CmpA, CmpB],
        html: `<cmp-a><cmp-b slot="${slotName}"></cmp-b> trailing text</cmp-a>`,
        hydrateServerSide: true,
      });
      const client = await newSpecPage({
        components: [],
        html: server.root.outerHTML,
        hydrateClientSide: true,
      });
      const parent = client.body.querySelector('cmp-a');
      const child = client.body.querySelector('cmp-b');
      const hosts = order === 'child-first' ? [child, parent] : [parent, child];

      for (const host of hosts) {
        // A custom element attaches its shadow root when it is defined.
        host.attachShadow({ mode: 'open' });
        initializeClientHydrate(host, host.localName, host.getAttribute('s-id'), { $flags$: 0 });
      }

      expect(parent.childNodes).toHaveLength(2);
      expect(parent.firstChild).toBe(child);
      expect(parent.lastChild.nodeType).toBe(3);
      expect(parent.lastChild.textContent).toBe(' trailing text');
      expect(child.hasAttribute('c-id')).toBe(false);
      expect(child.getAttribute('slot')).toBe(slotName);
      expect(child.shadowRoot).toEqualHtml('<span>Child content</span>');
      expect(parent.shadowRoot).toEqualHtml('<main><slot></slot><slot name="named"></slot></main>');
    });
  });

  it('functional', async () => {
    const Logo = () => (
      <svg>
        <title>Ionic Docs</title>
      </svg>
    );

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <header>
            <Logo />
          </header>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });

    const hostElm = document.createElement('cmp-a');
    hostElm.innerHTML = serverHydrated.root.innerHTML;

    const hostRef: d.HostRef = {
      $flags$: 0,
    };

    initializeClientHydrate(hostElm, 'cmp-a', '1', hostRef);

    const cmpAvnode = hostRef.$vnode$;
    expect(cmpAvnode.$tag$).toBe('cmp-a');

    expect(cmpAvnode.$children$).toHaveLength(1);
    expect(cmpAvnode.$children$[0].$tag$).toBe('header');

    expect(cmpAvnode.$children$[0].$children$).toHaveLength(1);
    expect(cmpAvnode.$children$[0].$children$[0].$tag$).toBe('svg');

    expect(cmpAvnode.$children$[0].$children$[0].$children$).toHaveLength(1);
    expect(cmpAvnode.$children$[0].$children$[0].$children$[0].$tag$).toBe('title');

    expect(cmpAvnode.$children$[0].$children$[0].$children$[0].$children$).toHaveLength(1);
    expect(cmpAvnode.$children$[0].$children$[0].$children$[0].$children$[0].$text$).toBe('Ionic Docs');
  });

  it('text child', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <Host>88mph</Host>;
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });

    const hostElm = document.createElement('cmp-a');
    hostElm.innerHTML = serverHydrated.root.innerHTML;

    const hostRef: d.HostRef = {
      $flags$: 0,
    };

    initializeClientHydrate(hostElm, 'cmp-a', '1', hostRef);

    const cmpAvnode = hostRef.$vnode$;
    expect(cmpAvnode.$tag$).toBe('cmp-a');

    expect(cmpAvnode.$children$).toHaveLength(1);
    expect(cmpAvnode.$children$[0].$text$.trim()).toBe('88mph');
  });
});
