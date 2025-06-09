import { minifyCss } from '../../../optimize/minify-css';

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
});
