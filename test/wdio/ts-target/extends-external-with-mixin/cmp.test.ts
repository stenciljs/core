import { browser } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';
import { testSuites } from '../extends-test-suite.test.js';

/**
 * Smoke tests for extending from external library component classes that internally use mixin patterns.
 * This tests Bug A: a project importing/rendering from a lib whose component utilises a mixin/abstract
 * class pattern - the decorated class members should be properly merged and have reactivity.
 *
 * The external library (test-sibling) has a component that uses `Mixin()` with a factory function.
 * This test extends from that component and verifies all decorated members from the mixin chain work.
 */

describe('Checks component classes can extend from external library components that use mixin patterns', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-external-with-mixin/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.main-prop-1'), { timeout: 5000 });
    });

    it('renders default values', async () => {
      const { defaultValue } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await defaultValue();
    });

    it('re-renders values via attributes', async () => {
      const { viaAttributes } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await viaAttributes();
    });

    it('re-renders values via props', async () => {
      const { viaProps } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await viaProps();
    });

    it('calls watch handlers', async () => {
      const { watchHandlers } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await watchHandlers();
    });

    it('calls methods', async () => {
      const { methods } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await methods();
    });
  });

  describe('es2022 dist-custom-elements output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest(
        '/extends-external-with-mixin/es2022.custom-element.html',
        'es2022-custom-elements',
      );
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.main-prop-1'), { timeout: 5000 });
    });

    it('renders default values', async () => {
      const { defaultValue } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await defaultValue();
    });

    it('re-renders values via attributes', async () => {
      const { viaAttributes } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await viaAttributes();
    });

    it('re-renders values via props', async () => {
      const { viaProps } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await viaProps();
    });

    it('calls watch handlers', async () => {
      const { watchHandlers } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await watchHandlers();
    });

    it('calls methods', async () => {
      const { methods } = await testSuites(frameContent, 'extends-external-with-mixin', 'sibling-with-mixin');
      await methods();
    });
  });

  describe('hydrate output', () => {
    it('renders component during SSR hydration via attributes', async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('/test-ts-target-output/hydrate/index.mjs');
      await (await testSuites(document.body, 'extends-external-with-mixin', 'sibling-with-mixin')).ssrViaAttrs(mod);
    });

    it('renders component during SSR hydration via props', async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('/test-ts-target-output/hydrate/index.mjs');
      await (await testSuites(document.body, 'extends-external-with-mixin', 'sibling-with-mixin')).ssrViaProps(mod);
    });
  });
});
