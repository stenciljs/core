import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];
let resetSsrDocData: HydrateModule['resetSsrDocData'];

/**
 * `reuseWindow` renders fragments into one long-lived window, so the SSR platform is evaluated
 * once instead of on every call. Every render must still come out exactly as if it had its own
 * window.
 */
test.describe('reuseWindow', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../dist/ssr/index.js');
    renderToString = mod.renderToString;
    resetSsrDocData = mod.resetSsrDocData;
  });

  const FRAGMENTS = [
    '<scoped-ssr-child-cmp>scoped text</scoped-ssr-child-cmp>',
    '<cmp-with-slot><span>light</span></cmp-with-slot>',
    '<shadow-text-parent-cmp text="nested"></shadow-text-parent-cmp>',
    '<plain-slot-cmp>plain</plain-slot-cmp>',
  ];

  const render = async (html: string, options: Record<string, unknown> = {}) => {
    resetSsrDocData();
    const result = await renderToString(html, { fullDocument: false, ...options });
    return result.html;
  };

  test('renders the same HTML as a fresh window, render after render', async () => {
    const fresh = [];
    for (const html of FRAGMENTS) fresh.push(await render(html));

    // twice through, so later renders reuse a window earlier ones dirtied
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < FRAGMENTS.length; i++) {
        expect(await render(FRAGMENTS[i], { reuseWindow: true })).toBe(fresh[i]);
      }
    }
  });

  test('includes scoped styles in every fragment, not only the first', async () => {
    for (let i = 0; i < 3; i++) {
      const html = await render('<scoped-ssr-child-cmp>x</scoped-ssr-child-cmp>', {
        reuseWindow: true,
      });
      expect(html).toMatch(/^<style sty-id="sc-scoped-ssr-child-cmp">/);
    }
  });

  test('keeps serializeShadowRoot modes apart', async () => {
    const html = '<cmp-with-slot><span>light</span></cmp-with-slot>';
    for (let i = 0; i < 2; i++) {
      const dsd = await render(html, {
        reuseWindow: true,
        serializeShadowRoot: 'declarative-shadow-dom',
      });
      const scoped = await render(html, { reuseWindow: true, serializeShadowRoot: 'scoped' });
      expect(dsd).toContain('<template shadowrootmode="open">');
      expect(scoped).not.toContain('<template shadowrootmode');
    }
  });

  test('reuses windows for object-form serializeShadowRoot, keeping different configs apart', async () => {
    const html = '<wrap-ssr-shadow-cmp>text</wrap-ssr-shadow-cmp>';
    const scopeIt = { default: 'declarative-shadow-dom' as const, scoped: ['wrap-ssr-shadow-cmp'] };
    const dsdIt = { default: 'declarative-shadow-dom' as const };
    const expected = {
      scopeIt: await render(html, { serializeShadowRoot: scopeIt }),
      dsdIt: await render(html, { serializeShadowRoot: dsdIt }),
    };
    // the wrapper is scoped in one config and DSD in the other (its nested ssr-shadow-cmp is DSD in both)
    const wrapperIsDsd = /<wrap-ssr-shadow-cmp[^>]*><template shadowrootmode="open">/;
    expect(expected.scopeIt).not.toMatch(wrapperIsDsd);
    expect(expected.dsdIt).toMatch(wrapperIsDsd);

    // alternate the two configs, so each reused window has seen the other's renders happen
    for (let i = 0; i < 3; i++) {
      expect(await render(html, { reuseWindow: true, serializeShadowRoot: scopeIt })).toBe(
        expected.scopeIt,
      );
      expect(await render(html, { reuseWindow: true, serializeShadowRoot: dsdIt })).toBe(
        expected.dsdIt,
      );
    }
    // an equivalent config (different casing and order) renders the same
    expect(
      await render(html, {
        reuseWindow: true,
        serializeShadowRoot: { scoped: ['WRAP-SSR-SHADOW-CMP'], default: 'declarative-shadow-dom' },
      }),
    ).toBe(expected.scopeIt);
  });

  test('renders concurrent calls one at a time, each correctly', async () => {
    resetSsrDocData();
    const htmls = Array.from(
      { length: 12 },
      (_, i) => `<plain-slot-cmp>item ${i}</plain-slot-cmp>`,
    );
    const results = await Promise.all(
      htmls.map((html) => renderToString(html, { fullDocument: false, reuseWindow: true })),
    );
    results.forEach((result, i) => {
      expect(result.html).toMatch(
        new RegExp(`<p class="plain-slot"[^>]*>(?:<!--[^>]*-->)*item ${i}</p>`),
      );
    });
    // fragments share one id sequence, so concurrent renders still get distinct ids
    const ids = results.map((r) => /s-id="(\d+)"/.exec(r.html!)![1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('picks up a tag transformer set after earlier reused renders', async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const { setTagTransformer } = await import('../dist/ssr/index.js');
    // set up the reused windows' platforms before the transformer exists
    await render('<plain-slot-cmp>before</plain-slot-cmp>', { reuseWindow: true });
    await renderToString('<plain-slot-cmp>before</plain-slot-cmp>', { reuseWindow: true });

    setTagTransformer((tag: string) => (tag === 'plain-slot-cmp' ? 'acme-plain-slot' : tag));
    try {
      const fragment = await render('<acme-plain-slot>after</acme-plain-slot>', {
        reuseWindow: true,
      });
      expect(fragment).toMatch(/<p class="plain-slot"[^>]*>(?:<!--[^>]*-->)*after<\/p>/);
      const page = await renderToString('<acme-plain-slot>page</acme-plain-slot>', {
        reuseWindow: true,
      });
      expect(page.html).toMatch(/<p class="plain-slot"[^>]*>(?:<!--[^>]*-->)*page<\/p>/);
    } finally {
      setTagTransformer((tag: string) => tag);
    }
  });

  test.describe('full documents', () => {
    const DOCUMENTS: { html: string; options?: Record<string, unknown> }[] = [
      {
        html: `<!doctype html><html lang="en" dir="ltr" class="theme-dark" data-page="one"><head><meta charset="utf-8"><title>One</title><link rel="canonical" href="https://example.test/one"><style>.page{color:red}</style></head><body class="page-one"><scoped-ssr-child-cmp>one</scoped-ssr-child-cmp></body></html>`,
      },
      {
        html: `<html><body><cmp-with-slot><span>no doctype or head</span></cmp-with-slot></body></html>`,
      },
      { html: `<shadow-text-parent-cmp text="bare"></shadow-text-parent-cmp>` },
      {
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html><head><title>Two</title></head><body><plain-slot-cmp>two</plain-slot-cmp><scoped-ssr-child-cmp>two</scoped-ssr-child-cmp></body></html>`,
      },
      {
        html: `<!doctype html><html><head><title>Ignored</title></head><body><scoped-ssr-child-cmp>options</scoped-ssr-child-cmp></body></html>`,
        options: {
          title: 'From options',
          language: 'fr',
          direction: 'rtl',
          canonicalUrl: 'https://example.test/canonical',
          url: 'https://example.test/page?x=1',
        },
      },
    ];

    const renderDocument = async (
      { html, options }: (typeof DOCUMENTS)[number],
      reuseWindow: boolean,
    ) => {
      resetSsrDocData();
      const result = await renderToString(html, { buildId: 'fixed', reuseWindow, ...options });
      const { html: output, title, httpStatus, hydratedCount, diagnostics } = result;
      return { output, title, httpStatus, hydratedCount, diagnostics };
    };

    test('render the same as a fresh window, whatever the previous document was', async () => {
      const fresh = [];
      for (const doc of DOCUMENTS) fresh.push(await renderDocument(doc, false));

      // forwards then backwards, so each document follows different ones in the reused window
      const order = [...DOCUMENTS.keys(), ...[...DOCUMENTS.keys()].reverse()];
      for (const i of order) {
        expect(await renderDocument(DOCUMENTS[i], true)).toEqual(fresh[i]);
      }
    });

    test('mix with fragment renders in the same window', async () => {
      const page = DOCUMENTS[0];
      const fragment = '<scoped-ssr-child-cmp>fragment</scoped-ssr-child-cmp>';
      const freshPage = await renderDocument(page, false);
      const freshFragment = await render(fragment);
      for (let i = 0; i < 2; i++) {
        expect(await renderDocument(page, true)).toEqual(freshPage);
        expect(await render(fragment, { reuseWindow: true })).toBe(freshFragment);
      }
    });

    test('number hydration ids from 1 in every document', async () => {
      for (let i = 0; i < 3; i++) {
        const { html } = await renderToString(DOCUMENTS[3].html, { reuseWindow: true });
        const ids = [...html!.matchAll(/ s-id="(\d+)"/g)].map((m) => Number(m[1]));
        expect(Math.min(...ids)).toBe(1);
      }
    });
  });

  test.describe('with a render that times out', () => {
    let originalFetch: any;
    let fetchCalls: { init: any; abortedWhenCalled: boolean }[];

    test.beforeEach(() => {
      fetchCalls = [];
      originalFetch = (global as any).fetch;
      // never settles unless its signal aborts
      (global as any).fetch = (_input: any, init: any) => {
        fetchCalls.push({ init, abortedWhenCalled: !!init?.signal?.aborted });
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err: any = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      };
    });

    test.afterEach(() => {
      (global as any).fetch = originalFetch;
    });

    test("doesn't abort the next render's fetch", async () => {
      // render 1 times out, aborting its own fetch
      const first = await renderToString(
        '<slow-fetch-cmp url="https://example.test/1"></slow-fetch-cmp>',
        {
          fullDocument: false,
          reuseWindow: true,
          timeout: 50,
        },
      );
      expect(
        first.diagnostics.some((d: any) => d.messageText.includes('Hydrate exceeded timeout')),
      ).toBe(true);
      expect(fetchCalls[0].init.signal.aborted).toBe(true);

      // render 2 reuses the window: its fetch gets a fresh signal, not render 1's aborted one
      const second = renderToString(
        '<slow-fetch-cmp url="https://example.test/2"></slow-fetch-cmp>',
        {
          fullDocument: false,
          reuseWindow: true,
          timeout: 50,
        },
      );
      await second;
      expect(fetchCalls.length).toBe(2);
      // (it's aborted later, by render 2's own timeout)
      expect(fetchCalls[1].abortedWhenCalled).toBe(false);
    });

    test('keeps working after a render fails', async () => {
      await renderToString('<slow-fetch-cmp url="https://example.test/x"></slow-fetch-cmp>', {
        fullDocument: false,
        reuseWindow: true,
        timeout: 20,
      });
      const html = await render('<plain-slot-cmp>after</plain-slot-cmp>', { reuseWindow: true });
      expect(html).toMatch(/<p class="plain-slot"[^>]*>(?:<!--[^>]*-->)*after<\/p>/);
    });
  });
});
