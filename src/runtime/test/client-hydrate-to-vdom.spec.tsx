import { Component, h, Host } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import type * as d from '../../declarations';
import { initializeClientHydrate } from '../client-hydrate';
import { renderVdom } from '../vdom/vdom-render';

describe('initializeClientHydrate', () => {
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

  // Regression test for https://github.com/stenciljs/core/issues/6934.
  it('collects SSR content in a nested non-shadow default slot before the owning host hydrates', async () => {
    @Component({
      tag: 'cmp-wrap',
      shadow: false,
    })
    class CmpWrap {
      render() {
        return (
          <Host>
            <slot />
          </Host>
        );
      }
    }

    @Component({
      tag: 'cmp-page',
      shadow: false,
    })
    class CmpPage {
      render() {
        return (
          <cmp-wrap>
            <div class="inner">Rendered by cmp-page</div>
          </cmp-wrap>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpPage, CmpWrap],
      html: `<cmp-page></cmp-page>`,
      hydrateServerSide: true,
    });
    const container = document.createElement('div');
    container.innerHTML = serverHydrated.root.outerHTML;

    const wrapElm = container.querySelector('cmp-wrap') as d.HostElement;
    const hostRef: d.HostRef = {
      $flags$: 0,
      $cmpMeta$: CmpWrap.COMPILER_META,
      $hostElement$: wrapElm,
    };
    initializeClientHydrate(wrapElm, 'cmp-wrap', '2', hostRef);
    renderVdom(hostRef, h('slot', null), true);

    const inner = wrapElm.querySelector('.inner');
    expect(inner?.hasAttribute('hidden')).toBe(false);
  });

  it('does not collect a serialized slot fallback from a foreign host', () => {
    const hostElm = document.createElement('cmp-host') as d.HostElement;
    hostElm.innerHTML = `
      <!--r.1-->
      <!--s.1.0.0.0.named-->
      <slot-fb c-id="2.0.0.0" s-sn="named"></slot-fb>
    `;
    const foreignFallback = hostElm.querySelector('slot-fb') as d.RenderNode;
    const hostRef: d.HostRef = { $flags$: 0 };

    initializeClientHydrate(hostElm, 'cmp-host', '1', hostRef);

    expect(foreignFallback['s-sn']).toBeUndefined();
  });

  it('does not let a serialized slot name override an explicit slot attribute', () => {
    const hostElm = document.createElement('cmp-host') as d.HostElement;
    hostElm.innerHTML = `
      <!--r.1-->
      <!--s.1.0.0.0.named-->
      <div c-id="2.0.0.0" s-sn="named" slot="explicit"></div>
    `;
    const explicitlySlotted = hostElm.querySelector('div') as d.RenderNode;
    const hostRef: d.HostRef = { $flags$: 0 };

    initializeClientHydrate(hostElm, 'cmp-host', '1', hostRef);

    expect(explicitlySlotted['s-sn']).toBeUndefined();
  });
});
