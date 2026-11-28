import { expect, type Page } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];

const LIGHT = 'ssr-style-light-cmp';
const SCOPED = 'ssr-style-scoped-cmp';
const SHADOW = 'ssr-style-shadow-cmp';
const TAGS = [LIGHT, SCOPED, SHADOW];

// a global stylesheet after the component styles must keep winning against them
const GLOBAL_STYLE = `<style>${LIGHT} { color: rgb(0, 0, 255); }</style>`;

const renderPage = async (clientScript: string) => {
  const { html } = await renderToString(
    TAGS.map((tag) => `<${tag}></${tag}><${tag}></${tag}>`).join(''),
    { fullDocument: true, serializeShadowRoot: 'scoped', prettyHtml: false },
  );
  return (html || '')
    .replace('</head>', `${GLOBAL_STYLE}</head>`)
    .replace('</body>', `${clientScript}</body>`);
};

const serve = async (page: Page, path: string, body: string) => {
  await page.route(`**/${path}`, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body }),
  );
  await page.goto(`/${path}`);
};

const expectHydratedStyles = async (page: Page) => {
  await page.waitForFunction(
    ({ tags, shadow }) =>
      tags.every((tag) => document.querySelector(tag)?.hasAttribute('custom-hydrate-flag')) &&
      !!document.querySelector(shadow)?.shadowRoot?.querySelector('p'),
    { tags: TAGS, shadow: SHADOW },
  );

  const result = await page.evaluate(
    ({ light, shadow }) => {
      const sheetsWith = (marker: string) => ({
        head: Array.from(document.head.querySelectorAll('style'))
          .filter((style) => (style.textContent || '').includes(marker))
          .map((style) => style.getAttribute('sty-id')),
        adopted: document.adoptedStyleSheets.filter((sheet) =>
          Array.from(sheet.cssRules).some((rule) => rule.cssText.includes(marker)),
        ).length,
      });
      const shadowP = document.querySelector(shadow)!.shadowRoot!.querySelector('p')!;
      return {
        light: sheetsWith('--ssr-style-light'),
        scoped: sheetsWith('--ssr-style-scoped'),
        shadow: sheetsWith('--ssr-style-shadow'),
        lightColor: getComputedStyle(document.querySelector(light)!).color,
        shadowWeight: getComputedStyle(shadowP).fontWeight,
      };
    },
    { light: LIGHT, shadow: SHADOW },
  );

  // non-shadow components reuse the server-rendered sheet in the head
  expect(result.light).toEqual({ head: [`sc-${LIGHT}`], adopted: 0 });
  expect(result.scoped).toEqual({ head: [`sc-${SCOPED}`], adopted: 0 });
  expect(result.lightColor).toBe('rgb(0, 0, 255)');

  // shadow components get their server-rendered 'scoped' styles converted back for the shadow root
  expect(result.shadowWeight).toBe('700');
  expect(result.shadow.adopted).toBe(0);
};

test.describe('SSR style hydration', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../dist/ssr/index.js');
    renderToString = mod.renderToString;
    mod.resetSsrDocData();
  });

  test('reuses server-rendered styles with the lazy loader', async ({ page }) => {
    const body = await renderPage('<script type="module" src="/build/ssrtests.esm.js"></script>');
    await serve(page, 'ssr-style-hydration-lazy', body);
    await expectHydratedStyles(page);
  });

  test('reuses server-rendered styles with standalone', async ({ page }) => {
    const defines = TAGS.map(
      (tag, i) =>
        `import { defineCustomElement as define${i} } from '/standalone/${tag}.js'; define${i}();`,
    ).join('\n');
    const body = await renderPage(`<script type="module">${defines}</script>`);
    await serve(page, 'ssr-style-hydration-standalone', body);
    await expectHydratedStyles(page);
  });
});
