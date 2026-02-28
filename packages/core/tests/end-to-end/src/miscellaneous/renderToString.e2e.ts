import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

import { CarData } from '../car-list/car-data';

const vento = new CarData('VW', 'Vento', 2024);
const beetle = new CarData('VW', 'Beetle', 2023);

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

test.describe('renderToString', () => {
  test.beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  test('allows to hydrate whole HTML page', async () => {
    const { html } = await renderToString(
      `<html>
      <head>
        <link rel="stylesheet" href="whatever.css" >
      </head>

      <body>
        <div class="__next">
          <main>
            <car-list cars=${JSON.stringify([vento, beetle])}></car-list>
          </main>
        </div>

        <script type="module">
            import { defineCustomElements } from "./static/loader/index.js";
            defineCustomElements().catch(console.error);
        </script>
      </body>
      </html>`,
      { fullDocument: true, serializeShadowRoot: false },
    );

    /**
     * starts with a DocType and HTML tag
     */
    expect(html.startsWith('<!doctype html><html ')).toBeTruthy();
    /**
     * renders hydration styles and custom link tag within the head tag
     */
    expect(html).toContain(
      '}</style> <link rel="stylesheet" href="whatever.css"> </head> <body> <div class="__next"> <main> <car-list',
    );
  });

  test('puts style after preconnect links in the head tag', async () => {
    const { html } = await renderToString(
      `<html>
      <head>
        <link rel="preconnect" href="https://some-url.com" />
        <style>
          .myComponent {
            display: none;
          }
        </style>
      </head>

      <body>
        <div class="__next">
          <main>
            <scoped-car-list cars=${JSON.stringify([vento, beetle])}></scoped-car-list>
          </main>
        </div>

        <script type="module">
            import { defineCustomElements } from "./static/loader/index.js";
            defineCustomElements().catch(console.error);
        </script>
      </body>
      </html>`,
      { fullDocument: true, serializeShadowRoot: false },
    );

    /**
     * expect the scoped component styles to be injected after the preconnect link
     */
    expect(html).toContain(
      '<link rel="preconnect" href="https://some-url.com"><style sty-id="sc-scoped-car-list">.sc-scoped-car-list-h',
    );
    /**
     * expect the custom style tag to be last in the head tag
     */
    expect(html.replaceAll(/\n[ ]*/g, '')).toContain(
      `.selected.sc-scoped-car-list{font-weight:bold;background:rgb(255, 255, 210)}</style> <style>.myComponent {display: none;}</style> </head> <body>`,
    );
  });

  test('puts styles before any custom styles', async () => {
    const { html } = await renderToString(
      `<html>
      <head>
        <style>
          .myComponent {
            display: none;
          }
        </style>
      </head>

      <body>
        <div class="__next">
          <main>
            <scoped-car-list cars=${JSON.stringify([vento, beetle])}></scoped-car-list>
          </main>
        </div>

        <script type="module">
            import { defineCustomElements } from "./static/loader/index.js";
            defineCustomElements().catch(console.error);
        </script>
      </body>
      </html>`,
      { fullDocument: true, serializeShadowRoot: false },
    );

    /**
     * expect the scoped component styles to be injected before custom styles
     */
    expect(html.replaceAll(/\n[ ]*/g, '')).toContain(
      '.selected.sc-scoped-car-list{font-weight:bold;background:rgb(255, 255, 210)}</style><style class="vjs-styles-defaults">.video-js {width: 300px;height: 150px;}.vjs-fluid:not(.vjs-audio-only-mode) {padding-top: 56.25%}</style> <style>.myComponent {display: none;}</style> </head>',
    );
  });

  test('allows to hydrate whole HTML page with using a scoped component', async () => {
    const { html } = await renderToString(
      `<html>
      <head>
        <link rel="stylesheet" href="whatever.css" >
      </head>

      <body>
        <div class="__next">
          <main>
            <scoped-car-list cars=${JSON.stringify([vento, beetle])}></scoped-car-list>
          </main>
        </div>

        <script type="module">
            import { defineCustomElements } from "./static/loader/index.js";
            defineCustomElements().catch(console.error);
        </script>
      </body>
      </html>`,
      { fullDocument: true, serializeShadowRoot: false },
    );
    /**
     * starts with a DocType and HTML tag
     */
    expect(html.startsWith('<!doctype html><html ')).toBeTruthy();
    /**
     * renders hydration styles and custom link tag within the head tag
     */
    expect(html.replaceAll(/\n[ ]*/g, '')).toContain(
      '<head><meta charset="utf-8"><style sty-id="sc-scoped-car-list">.sc-scoped-car-list-h{display:block;margin:10px;padding:10px;border:1px solid blue}ul.sc-scoped-car-list{display:block;margin:0;padding:0}li.sc-scoped-car-list{list-style:none;margin:0;padding:20px}.selected.sc-scoped-car-list{font-weight:bold;background:rgb(255, 255, 210)}</style><style class="vjs-styles-defaults">.video-js {width: 300px;height: 150px;}.vjs-fluid:not(.vjs-audio-only-mode) {padding-top: 56.25%}</style> <link rel="stylesheet" href="whatever.css"> </head>',
    );
  });

  test('populates style information even if we do not render the whole document', async () => {
    const { styles } = await renderToString(
      `<scoped-car-list cars=${JSON.stringify([vento, beetle])}></scoped-car-list>`,
    );
    expect(styles.length).toBe(2);
    expect(styles[0].id).toBe('sc-scoped-car-list');
    expect(styles[0].content).toContain('.sc-scoped-car-list-h{display:block;');
    expect(styles[1].content).toContain('.video-js {');
  });
});
