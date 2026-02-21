import { browser } from '@wdio/globals';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate/index.js');

export const testSuites = async (root: HTMLElement, mainTag: string, extendedTag?: string) => {
  async function getTxt(selector: string) {
    await browser.waitUntil(() => !!root.querySelector(selector), { timeout: 5000 });
    return root.querySelector(selector).textContent.trim();
  }

  function getTxtHtml(html: string, className: string) {
    const match = html.match(new RegExp(`<p class="${className}".*?>(.*?)</p>`, 'g'));
    if (match && match[0]) {
      const textMatch = match[0].match(new RegExp(`<p class="${className}".*?>(.*?)</p>`));
      return textMatch ? textMatch[1].replace(/<!--.*?-->/g, '').trim() : null;
    }
    return null;
  }

  return {
    defaultValue: async () => {
      if (extendedTag) {
        expect(await getTxt('.extended-prop-1')).toBe('Extended class prop 1: ExtendedCmp text');
        expect(await getTxt('.extended-prop-2')).toBe('Extended class prop 2: ExtendedCmp prop2 text');
        expect(await getTxt('.extended-state-1')).toBe('Extended class state 1: ExtendedCmp state text');
        expect(await getTxt('.extended-state-2')).toBe('Extended class state 2: ExtendedCmp state2 text');
      }
      expect(await getTxt('.main-prop-1')).toBe('Main class prop1: default text');
      expect(await getTxt('.main-prop-2')).toBe('Main class prop2: ExtendedCmp prop2 text');
      expect(await getTxt('.main-state-1')).toBe('Main class state1: default state text');
      expect(await getTxt('.main-state-2')).toBe('Main class state2: ExtendedCmp state2 text');
    },
    viaAttributes: async () => {
      if (extendedTag) {
        root.querySelector(extendedTag).setAttribute('prop-1', 'extended via attribute');
        root.querySelector(extendedTag).setAttribute('prop-2', 'extended via attribute');
      }
      root.querySelector(mainTag).setAttribute('prop-1', 'main via attribute');
      root.querySelector(mainTag).setAttribute('prop-2', 'main via attribute');

      await browser.pause(100);

      if (extendedTag) {
        expect(await getTxt('.extended-prop-1')).toBe('Extended class prop 1: extended via attribute');
        expect(await getTxt('.extended-prop-2')).toBe('Extended class prop 2: extended via attribute');
      }
      expect(await getTxt('.main-prop-1')).toBe('Main class prop1: main via attribute');
      expect(await getTxt('.main-prop-2')).toBe('Main class prop2: main via attribute');
    },
    viaProps: async () => {
      if (extendedTag) {
        root.querySelector<any>(extendedTag).prop1 = 'extended via prop';
        root.querySelector<any>(extendedTag).prop2 = 'extended via prop';
      }
      root.querySelector<any>(mainTag).prop1 = 'main via prop';
      root.querySelector<any>(mainTag).prop2 = 'main via prop';

      await browser.pause(100);

      if (extendedTag) {
        expect(await getTxt('.extended-prop-1')).toBe('Extended class prop 1: extended via prop');
        expect(await getTxt('.extended-prop-2')).toBe('Extended class prop 2: extended via prop');
      }
      expect(await getTxt('.main-prop-1')).toBe('Main class prop1: main via prop');
      expect(await getTxt('.main-prop-2')).toBe('Main class prop2: main via prop');
    },
    watchHandlers: async () => {
      const iframeWin = root.ownerDocument.defaultView;
      let originalConsoleLog = iframeWin.console.info;

      const logMessages: string[] = [];
      iframeWin.console.info = (...args: any[]) => {
        logMessages.push(args.map(String).join(' '));
      };

      if (extendedTag) {
        root.querySelector(extendedTag).setAttribute('prop-1', 'extended via attribute');
        root.querySelector(extendedTag).setAttribute('prop-2', 'extended via attribute');
      }
      root.querySelector(mainTag).setAttribute('prop-1', 'main via attribute');
      root.querySelector(mainTag).setAttribute('prop-2', 'main via attribute');

      await browser.pause(100);

      if (extendedTag) {
        root.querySelector<any>(extendedTag).prop1 = 'extended via prop';
        root.querySelector<any>(extendedTag).prop2 = 'extended via prop';
      }
      root.querySelector<any>(mainTag).prop1 = 'main via prop';
      root.querySelector<any>(mainTag).prop2 = 'main via prop';

      await browser.pause(100);

      if (extendedTag) {
        expect(logMessages).toEqual([
          'extended class handler prop1: extended via attribute',
          'extended class handler prop2: extended via attribute',
          'main class handler prop1: main via attribute',
          'extended class handler prop2: main via attribute',
          'extended class handler prop1: extended via prop',
          'extended class handler prop2: extended via prop',
          'main class handler prop1: main via prop',
          'extended class handler prop2: main via prop',
        ]);
      } else {
        expect(logMessages).toEqual([
          'main class handler prop1: main via attribute',
          'extended class handler prop2: main via attribute',
          'main class handler prop1: main via prop',
          'extended class handler prop2: main via prop',
        ]);
      }

      iframeWin.console.info = originalConsoleLog;
    },
    methods: async () => {
      if (extendedTag) {
        const component1 = root.querySelector<any>(extendedTag);
        await component1.method1();
        await browser.pause(50);
        expect(await getTxt('.extended-prop-1')).toBe('Extended class prop 1: ExtendedCmp method1 called');

        await component1.method2();
        await browser.pause(50);
        expect(await getTxt('.extended-prop-1')).toBe('Extended class prop 1: ExtendedCmp method2 called');
      }

      const component2 = root.querySelector<any>(mainTag);
      await component2.method1();
      await browser.pause(50);
      expect(await getTxt('.main-prop-1')).toBe('Main class prop1: main class method1 called');

      await component2.method2();
      await browser.pause(50);
      expect(await getTxt('.main-prop-1')).toBe('Main class prop1: ExtendedCmp method2 called');
    },
    ssrViaAttrs: async (hydrationModule: any) => {
      const renderToString: HydrateModule['renderToString'] = hydrationModule.renderToString;
      const { html } = await renderToString(`
        <${mainTag}
          prop-1="main via attr"
          prop-2="main via attr"
        ></${mainTag}>
      `);
      expect(await getTxtHtml(html, 'main-prop-1')).toBe('Main class prop1: main via attr');
      expect(await getTxtHtml(html, 'main-prop-2')).toBe('Main class prop2: main via attr');
    },
    ssrViaProps: async (hydrationModule: any) => {
      const renderToString: HydrateModule['renderToString'] = hydrationModule.renderToString;
      const { html } = await renderToString(`<${mainTag}></${mainTag}>`, {
        beforeHydrate: (doc: Document) => {
          const el = doc.querySelector<any>(mainTag);
          el.prop1 = 'main via prop';
          el.prop2 = 'main via prop';
        },
      });
      expect(await getTxtHtml(html, 'main-prop-1')).toBe('Main class prop1: main via prop');
      expect(await getTxtHtml(html, 'main-prop-2')).toBe('Main class prop2: main via prop');
    },
  };
};
