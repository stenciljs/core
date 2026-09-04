import { CarData } from '../car-list/car-data';

const vento = new CarData('VW', 'Vento', 2024);
const beetle = new CarData('VW', 'Beetle', 2023);

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('renderToString', () => {
  beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  it('allows to hydrate whole HTML page', async () => {
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

  it('puts style after preconnect links in the head tag', async () => {
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

  it('puts styles before any custom styles', async () => {
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

  it('allows to hydrate whole HTML page with using a scoped component', async () => {
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

  it('populates style information even if we do not render the whole document', async () => {
    const { styles } = await renderToString(
      `<scoped-car-list cars=${JSON.stringify([vento, beetle])}></scoped-car-list>`,
    );
    expect(styles.length).toBe(2);
    expect(styles[0].id).toBe('sc-scoped-car-list');
    expect(styles[0].content).toContain('.sc-scoped-car-list-h{display:block;');
    expect(styles[1].content).toContain('.video-js {');
  });

  it('reuses a window without changing fragment parsing', async () => {
    const input = '<link rel="stylesheet" href="/style.css"><slot-cmp>Hello World</slot-cmp>';
    const options = {
      fullDocument: false,
      reuseWindow: true,
      serializeShadowRoot: 'declarative-shadow-dom' as const,
    };

    const first = await renderToString(input, options);
    const second = await renderToString(input, options);

    expect(first.html).not.toContain('<link');
    expect(second.html).not.toContain('<link');
    expect(second.html).toContain('<slot-cmp');
    expect(second.html).toContain('Hello World');
  });

  it('serializes reused renders that use the same shadow mode', async () => {
    let releaseFirstRender!: () => void;
    let firstRenderStarted!: () => void;
    let secondRenderStarted = false;
    const firstRenderGate = new Promise<void>((resolve) => (releaseFirstRender = resolve));
    const firstRenderStart = new Promise<void>((resolve) => (firstRenderStarted = resolve));
    const options = {
      fullDocument: false,
      reuseWindow: true,
      serializeShadowRoot: 'scoped' as const,
    };

    const firstRender = renderToString('<slot-cmp>First</slot-cmp>', {
      ...options,
      beforeHydrate: () => {
        firstRenderStarted();
        return firstRenderGate;
      },
    });
    await firstRenderStart;

    const secondRender = renderToString('<slot-cmp>Second</slot-cmp>', {
      ...options,
      beforeHydrate: () => {
        secondRenderStarted = true;
      },
    });
    await Promise.resolve();
    expect(secondRenderStarted).toBe(false);

    releaseFirstRender();
    await Promise.all([firstRender, secondRender]);
    expect(secondRenderStarted).toBe(true);
  });

  it('runs reused renders with different shadow modes concurrently', async () => {
    let releaseRenders!: () => void;
    let rendersStarted = 0;
    let bothRendersStarted!: () => void;
    const renderGate = new Promise<void>((resolve) => (releaseRenders = resolve));
    const renderStart = new Promise<void>((resolve) => (bothRendersStarted = resolve));
    const beforeHydrate = () => {
      rendersStarted++;
      if (rendersStarted === 2) {
        bothRendersStarted();
      }
      return renderGate;
    };

    const declarativeRender = renderToString('<slot-cmp>Declarative</slot-cmp>', {
      beforeHydrate,
      fullDocument: false,
      reuseWindow: true,
      serializeShadowRoot: 'declarative-shadow-dom',
    });
    const scopedRender = renderToString('<slot-cmp>Scoped</slot-cmp>', {
      beforeHydrate,
      fullDocument: false,
      reuseWindow: true,
      serializeShadowRoot: 'scoped',
    });

    await renderStart;
    expect(rendersStarted).toBe(2);

    releaseRenders();
    await Promise.all([declarativeRender, scopedRender]);
  });
});
