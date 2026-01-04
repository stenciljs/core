import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser } from '@wdio/globals';

import { setupIFrameTest } from '../../util.js';

/**
 * Smoke tests for `tsconfig.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 */

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');

const testSuites = async (root: HTMLTsTargetPropsElement) => {
  async function getTxt(selector: string) {
    // Try querying the root element first (for scoped components)
    // If that fails, try querying shadow root (for shadow DOM components)
    await browser.waitUntil(
      () => {
        const element = root.querySelector(selector);
        if (element) return true;
        // Check shadow root if it exists
        if (root.shadowRoot) {
          return !!root.shadowRoot.querySelector(selector);
        }
        return false;
      },
      { timeout: 10000 },
    );
    const element = root.querySelector(selector) || root.shadowRoot?.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    return element.textContent.trim();
  }
  function getTxtHtml(html: string, className: string) {
    // Try multiple patterns to match the HTML structure
    // Pattern 1: <div class="className">content</div>
    // Pattern 2: <div class="className" ...>content</div>
    // Pattern 3: Handle scoped class names (e.g., class="basicProp s-xyz")
    const patterns = [
      new RegExp(`<div class="${className}"[^>]*>(.*?)</div>`, 's'),
      new RegExp(`<div class="[^"]*\\b${className}\\b[^"]*"[^>]*>(.*?)</div>`, 's'),
      new RegExp(`<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>(.*?)</div>`, 's'),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const text = match[1]
          .replace(/<!--.*?-->/g, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (text) {
          return text;
        }
      }
    }
    return null;
  }

  return {
    defaultValue: async () => {
      expect(await getTxt('.basicProp')).toBe('basicProp');
      expect(await getTxt('.decoratedProp')).toBe('-5');
      expect(await getTxt('.decoratedGetterSetterProp')).toBe('999');
      expect(await getTxt('.basicState')).toBe('basicState');
      expect(await getTxt('.decoratedState')).toBe('10');
    },
    viaAttributes: async () => {
      root.setAttribute('decorated-prop', '200');
      root.setAttribute('decorated-getter-setter-prop', '-5');
      root.setAttribute('basic-prop', 'basicProp via attribute');
      root.setAttribute('basic-state', 'basicState via attribute');
      root.setAttribute('decorated-state', 'decoratedState via attribute');

      await browser.pause(100);

      expect(await getTxt('.basicProp')).toBe('basicProp via attribute');
      expect(await getTxt('.decoratedProp')).toBe('25');
      expect(await getTxt('.decoratedGetterSetterProp')).toBe('0');
      expect(await getTxt('.basicState')).toBe('basicState');
      expect(await getTxt('.decoratedState')).toBe('10');
    },
    viaProps: async (nativeElement: boolean = false) => {
      root.basicProp = 'basicProp via prop';
      root.decoratedProp = -3;
      root.decoratedGetterSetterProp = 543;
      // @ts-ignore
      root.basicState = 'basicState via prop';
      // @ts-ignore
      root.decoratedState = 3;

      await browser.pause(100);

      expect(await getTxt('.basicProp')).toBe('basicProp via prop');
      expect(await getTxt('.decoratedProp')).toBe('-3');
      expect(await getTxt('.decoratedGetterSetterProp')).toBe('543');

      // you can change internal state via prop within native elements because the class instance === the element
      const basicStateMatch = !nativeElement ? 'basicState' : 'basicState via prop';
      expect(await getTxt('.basicState')).toBe(basicStateMatch);
      const decoratedStateMatch = !nativeElement ? '10' : '3';
      expect(await getTxt('.decoratedState')).toBe(decoratedStateMatch);
    },
    reflectsStateChanges: async () => {
      expect(await getTxt('.basicState')).toBe('basicState');
      expect(await getTxt('.decoratedState')).toBe('10');

      // Try querying buttons from root or shadow root
      const buttons =
        root.querySelectorAll('button').length > 0
          ? root.querySelectorAll('button')
          : root.shadowRoot?.querySelectorAll('button') || [];
      if (buttons.length < 2) {
        throw new Error(`Expected at least 2 buttons, found ${buttons.length}`);
      }
      buttons[0].click();
      await browser.pause(100);
      expect(await getTxt('.basicState')).toBe('basicState changed');

      buttons[1].click();
      await browser.pause(100);
      expect(await getTxt('.decoratedState')).toBe('0');
    },
    ssrViaAttrs: async (hydrationModule: any) => {
      const renderToString: HydrateModule['renderToString'] = hydrationModule.renderToString;
      const { html } = await renderToString(
        `
        <ts-target-props
          basic-prop="basicProp via attribute"
          decorated-prop="200"
          decorated-getter-setter-prop="-5"
          basic-state="basicState via attribute"
          decorated-state="decoratedState via attribute"
        ></ts-target-props>
      `,
        {
          serializeShadowRoot: true,
          fullDocument: false,
        },
      );
      expect(await getTxtHtml(html, 'basicProp')).toBe('basicProp pnpmvia attribute');
      expect(await getTxtHtml(html, 'decoratedProp')).toBe('25');
      expect(await getTxtHtml(html, 'decoratedGetterSetterProp')).toBe('0');
      expect(await getTxtHtml(html, 'basicState')).toBe('basicState via attribute');
      expect(await getTxtHtml(html, 'decoratedState')).toBe('10');
    },
    ssrViaProps: async (hydrationModule: any) => {
      const renderToString: HydrateModule['renderToString'] = hydrationModule.renderToString;
      const { html } = await renderToString(`<ts-target-props></ts-target-props>`, {
        serializeShadowRoot: true,
        fullDocument: false,
        beforeHydrate: (doc: Document) => {
          const el = doc.querySelector('ts-target-props');
          el.basicProp = 'basicProp via prop';
          el.decoratedProp = -3;
          el.decoratedGetterSetterProp = 543;
          // @ts-ignore
          el.basicState = 'basicState via prop';
          // @ts-ignore
          el.decoratedState = 3;
        },
      });
      expect(await getTxtHtml(html, 'basicProp')).toBe('basicProp via prop');
      expect(await getTxtHtml(html, 'decoratedProp')).toBe('-3');
      expect(await getTxtHtml(html, 'decoratedGetterSetterProp')).toBe('543');
      expect(await getTxtHtml(html, 'basicState')).toBe('basicState');
      expect(await getTxtHtml(html, 'decoratedState')).toBe('10');
    },
    dynamicLifecycleMethods: async () => {
      // Initialize lifecycle calls array if not already initialized
      if (!window.lifecycleCalls) {
        window.lifecycleCalls = [];
      }
      root.basicProp = 'basicProp via prop';
      await browser.pause(100);
      // Try querying buttons from root or shadow root
      const buttons =
        root.querySelectorAll('button').length > 0
          ? root.querySelectorAll('button')
          : root.shadowRoot?.querySelectorAll('button') || [];
      if (buttons.length === 0) {
        throw new Error('No buttons found in component');
      }
      buttons[0].click();
      await browser.pause(100);
      root.remove();
      await browser.pause(100);

      expect(window.lifecycleCalls).toBeDefined();
      expect(window.lifecycleCalls).toContain('componentWillLoad');
      expect(window.lifecycleCalls).toContain('componentWillRender');
      expect(window.lifecycleCalls).toContain('componentDidLoad');
      expect(window.lifecycleCalls).toContain('componentDidRender');
      expect(window.lifecycleCalls).toContain('connectedCallback');
      expect(window.lifecycleCalls).toContain('disconnectedCallback');
      expect(window.lifecycleCalls).toContain('componentShouldUpdate');
      expect(window.lifecycleCalls).toContain('componentWillUpdate');
      expect(window.lifecycleCalls).toContain('componentDidUpdate');
    },
  };
};

describe('Checks class properties and runtime decorators of different es targets', () => {
  describe('default / control - 2017 dist output', () => {
    it('renders default values', async () => {
      render({ template: () => <ts-target-props /> });
      await (await $('ts-target-props')).waitForStable();
      await (await testSuites(document.querySelector('ts-target-props'))).defaultValue();
    });

    it('re-renders values via attributes', async () => {
      render({ template: () => <ts-target-props /> });
      await (await $('ts-target-props')).waitForStable();
      await (await testSuites(document.querySelector('ts-target-props'))).viaAttributes();
    });

    it('re-renders values via props', async () => {
      render({
        html: `
        <ts-target-props></ts-target-props>`,
      });
      await (await $('ts-target-props')).waitForStable();
      await (await testSuites(document.querySelector('ts-target-props'))).viaProps();
    });

    it('reflects internal state changes to the dom', async () => {
      render({ template: () => <ts-target-props /> });
      await (await $('ts-target-props')).waitForStable();
      await (await testSuites(document.querySelector('ts-target-props'))).reflectsStateChanges();
    });

    it('renders component during SSR hydration', async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('/hydrate/index.mjs');
      await (await testSuites(document.querySelector('ts-target-props'))).ssrViaProps(mod);
    });

    it('adds dynamic lifecycle hooks', async () => {
      render({ template: () => <ts-target-props /> });
      await (await $('ts-target-props')).waitForStable();
      await (await testSuites(document.querySelector('ts-target-props'))).dynamicLifecycleMethods();
    });
  });

  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/ts-target-props/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      frameEle.waitUntil(async () => !!frameContent.querySelector('.basicState'), { timeout: 5000 });
    });

    it('renders default values', async () => {
      const { defaultValue } = await testSuites(frameContent.querySelector('ts-target-props'));
      await defaultValue();
    });

    it('re-renders values via attributes', async () => {
      const { viaAttributes } = await testSuites(frameContent.querySelector('ts-target-props'));
      await viaAttributes();
    });

    it('re-renders values via props', async () => {
      const { viaProps } = await testSuites(frameContent.querySelector('ts-target-props'));
      await viaProps();
    });

    it('reflects internal state changes to the dom', async () => {
      const { reflectsStateChanges } = await testSuites(frameContent.querySelector('ts-target-props'));
      await reflectsStateChanges();
    });

    it('renders component during SSR hydration', async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('/test-ts-target-output/hydrate/index.mjs');
      await (await testSuites(document.querySelector('ts-target-props'))).ssrViaProps(mod);
    });

    it('adds dynamic lifecycle hooks', async () => {
      const { dynamicLifecycleMethods } = await testSuites(frameContent.querySelector('ts-target-props'));
      await dynamicLifecycleMethods();
    });
  });

  describe('es2022 dist-custom-elements output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/ts-target-props/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      frameEle.waitUntil(async () => !!frameContent.querySelector('.basicState'), { timeout: 5000 });
    });

    it('renders default values', async () => {
      const { defaultValue } = await testSuites(frameContent.querySelector('ts-target-props'));
      await defaultValue();
    });

    it('re-renders values via attributes', async () => {
      const { viaAttributes } = await testSuites(frameContent.querySelector('ts-target-props'));
      await viaAttributes();
    });

    it('re-renders values via props', async () => {
      const { viaProps } = await testSuites(frameContent.querySelector('ts-target-props'));
      await viaProps(true);
    });

    it('reflects internal state changes to the dom', async () => {
      const { reflectsStateChanges } = await testSuites(frameContent.querySelector('ts-target-props'));
      await reflectsStateChanges();
    });

    it('adds dynamic lifecycle hooks', async () => {
      const { dynamicLifecycleMethods } = await testSuites(frameContent.querySelector('ts-target-props'));
      await dynamicLifecycleMethods();
    });
  });
});
