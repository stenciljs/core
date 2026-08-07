import { Component, getMode, setMode } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('style', () => {
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

  it('re-attaches a removed style element when the component is rendered again', async () => {
    @Component({
      tag: 'cmp-a',
      styles: `
        cmp-a {
          color: red;
        }
      `,
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

    const findCmpStyle = () =>
      Array.from(page.doc.head.querySelectorAll('style')).find((styleElm) => styleElm.textContent?.includes('color: red'));

    const initialStyleElm = findCmpStyle();
    expect(initialStyleElm).toBeDefined();

    initialStyleElm!.remove();
    expect(findCmpStyle()).toBeUndefined();

    await page.setContent(`<cmp-a></cmp-a>`);

    const reattachedStyleElm = findCmpStyle();
    expect(reattachedStyleElm).toBeDefined();
    expect(reattachedStyleElm!.isConnected).toBe(true);
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
