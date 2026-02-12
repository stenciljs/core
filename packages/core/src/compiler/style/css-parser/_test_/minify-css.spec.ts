import { minifyCss } from '../../../optimize/minify-css';
import { describe, it, expect } from 'vitest'; 

describe('minifyCss', () => {
  it('adds background-image url hash', async () => {
    const c = await minifyCss({
      css: `
        div {
          background: url('/assets/image.png')
        }
      `,
      resolveUrl: (url) => {
        return url + '?mph=88';
      },
    });
    expect(c).toBe(`div{background:url('/assets/image.png?mph=88')}`);
  });

  it('font-face url hash', async () => {
    const c = await minifyCss({
      css: `
        @font-face {
          font-family: "Open Sans";
          src: url("/font.woff2") format("woff2"),
               url('/font.woff') format('woff');
        }
      `,
      resolveUrl(url) {
        return url + '?mph=88';
      },
    });
    expect(c).toBe(
      `@font-face{font-family:"Open Sans";src:url("/font.woff2?mph=88") format("woff2"),url('/font.woff?mph=88') format('woff')}`,
    );
  });
  it('preserves spaces in @container queries', async () => {
    const css = `main {
      container-type: inline-size;
      container-name: main;
    }
    .h3 {
      font-weight: bold;
      font-size: 1rem;
    }
    @container main (width >= 100px) {
      .h3 {
        font-size: 2rem;
      }
    }
    @container main (width >= 200px) {
      .h3 {
        font-size: 4rem;
      }
    }`;

    const result = await minifyCss({ css });

    expect(result).toBe(
      'main{container-type:inline-size;container-name:main}.h3{font-weight:bold;font-size:1rem}@container main (width >= 100px){.h3{font-size:2rem}}@container main (width >= 200px){.h3{font-size:4rem}}',
    );
  });
});
