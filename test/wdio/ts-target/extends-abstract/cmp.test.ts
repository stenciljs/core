import { browser } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';
import { testSuites } from '../extends-test-suite.test.js';

/**
 * Smoke tests for extending mixin classes. Built with
 *  `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 */

describe('Checks component classes can extend from other, Stencil decorated abstract classes', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-abstract/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.main-prop-1'), { timeout: 5000 });
    });

    it('renders default values', async () => {
      const { defaultValue } = await testSuites(frameContent, 'extends-abstract');
      await defaultValue();
    });

    it('re-renders values via attributes', async () => {
      const { viaAttributes } = await testSuites(frameContent, 'extends-abstract');
      await viaAttributes();
    });

    it('re-renders values via props', async () => {
      const { viaProps } = await testSuites(frameContent, 'extends-abstract');
      await viaProps();
    });

    it('calls watch handlers', async () => {
      const { watchHandlers } = await testSuites(frameContent, 'extends-abstract');
      await watchHandlers();
    });

    it('calls methods', async () => {
      const { methods } = await testSuites(frameContent, 'extends-abstract');
      await methods();
    });
  });

  describe('es2022 dist-custom-elements output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/extends-abstract/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.main-prop-1'), { timeout: 5000 });
    });

    it('renders default values', async () => {
      const { defaultValue } = await testSuites(frameContent, 'extends-abstract');
      await defaultValue();
    });

    it('re-renders values via attributes', async () => {
      const { viaAttributes } = await testSuites(frameContent, 'extends-abstract');
      await viaAttributes();
    });

    it('re-renders values via props', async () => {
      const { viaProps } = await testSuites(frameContent, 'extends-abstract');
      await viaProps();
    });

    it('calls watch handlers', async () => {
      const { watchHandlers } = await testSuites(frameContent, 'extends-abstract');
      await watchHandlers();
    });

    it('calls methods', async () => {
      const { methods } = await testSuites(frameContent, 'extends-abstract');
      await methods();
    });
  });

  describe('hydrate output', () => {
    it('renders component during SSR hydration via attributes', async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('/test-ts-target-output/hydrate/index.mjs');
      await (await testSuites(document.body, 'extends-abstract')).ssrViaAttrs(mod);
    });

    it('renders component during SSR hydration via props', async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('/test-ts-target-output/hydrate/index.mjs');
      await (await testSuites(document.body, 'extends-abstract')).ssrViaProps(mod);
    });
  });
});
