import { Component, getMode, setMode } from '@stencil/core';
import { getHostRef } from '@stencil/core/internal/testing';
import { newSpecPage } from '@stencil/core/testing';

import { addStyle } from '../styles';

describe('style', () => {
  it('adds a hydration id to server-rendered styles without encapsulation', async () => {
    @Component({
      tag: 'cmp-a',
      shadow: false,
      scoped: false,
      styles: 'cmp-a { color: red; }',
    })
    class CmpA {
      render() {
        return `innertext`;
      }
    }

    const { doc } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
      attachStyles: true,
    });

    const style = doc.head.querySelector('style[sty-id="sc-cmp-a"]');
    expect(style).not.toBeNull();
    expect(style.textContent).toContain('cmp-a { color: red; }');
  });

  it('reuses server-rendered styles without rewriting them during hydration', async () => {
    @Component({
      tag: 'cmp-a',
      styles: 'cmp-a { color: red; }',
    })
    class CmpA {
      render() {
        return `innertext`;
      }
    }

    const page = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a><cmp-a></cmp-a>`,
      hydrateClientSide: true,
      attachStyles: true,
      flushQueue: false,
    });
    const serverStyle = page.doc.createElement('style');
    serverStyle.setAttribute('sty-id', 'sc-cmp-a');
    serverStyle.textContent = 'server-rendered-style';
    page.doc.head.append(serverStyle);

    await page.waitForChanges();

    const styles = page.doc.head.querySelectorAll('style[sty-id="sc-cmp-a"]');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe('server-rendered-style');
  });

  it('updates an existing style during HMR', async () => {
    @Component({
      tag: 'cmp-a',
      styles: 'cmp-a { color: red; }',
    })
    class CmpA {
      render() {
        return `innertext`;
      }
    }

    const page = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      attachStyles: true,
    });
    const style = page.doc.head.querySelector('style');
    style.setAttribute('sty-id', 'sc-cmp-a');
    page.build.hotModuleReplacement = true;
    page.styles.set('sc-cmp-a', 'hmr-updated-style');

    addStyle(page.doc, getHostRef(page.root).$cmpMeta$);

    expect(style.textContent).toBe('hmr-updated-style');
  });

  it('get style string', async () => {
    @Component({
      tag: 'cmp-a',
      styles: `
        div {
          color: red;
        }
      `,
    })
    class CmpA {
      render() {
        return `innertext`;
      }
    }

    const { root, styles } = await newSpecPage({
      components: [CmpA],
      includeAnnotations: true,
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toHaveClass('hydrated');
    expect(styles.get('sc-cmp-a')).toContain(`color: red;`);
  });

  it('applies the nonce value to the head style tags', async () => {
    @Component({
      tag: 'cmp-a',
      styles: `
        div {
          color: red;
        }
      `,
    })
    class CmpA {
      render() {
        return `innertext`;
      }
    }

    const { doc } = await newSpecPage({
      components: [CmpA],
      includeAnnotations: true,
      html: `<cmp-a></cmp-a>`,
      platform: {
        $nonce$: '1234',
      },
    });

    expect(doc.head.innerHTML).toEqual(
      '<style data-styles nonce="1234">cmp-a{visibility:hidden}.hydrated{visibility:inherit}</style>',
    );
  });

  describe('mode', () => {
    it('md mode', async () => {
      setMode(() => 'md');
      @Component({
        tag: 'cmp-a',
        styles: {
          ios: `:host { color: black }`,
          md: `:host { color: red }`,
        },
      })
      class CmpA {
        render() {
          return `Hola`;
        }
      }

      const { root, styles } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(styles.get('sc-cmp-a-md')).toEqual(':host { color: red }');
      expect(getMode(root)).toEqual('md');
    });

    it('ios mode', async () => {
      setMode(() => 'ios');
      @Component({
        tag: 'cmp-a',
        styles: {
          ios: `:host { color: black };`,
          md: `:host { color: red };`,
        },
      })
      class CmpA {
        render() {
          return `Hola`;
        }
      }
      const { root, styles } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(styles.get('sc-cmp-a-ios')).toEqual(':host { color: black };');
      expect(getMode(root)).toEqual('ios');
    });
  });
});
