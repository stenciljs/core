// @vitest-environment stencil

import { Component } from '@stencil/core';
import { LazyBundlesRuntimeData } from '@stencil/core/compiler';
import { expect, describe, it, vi } from '@stencil/vitest';
import { win, getHostRef } from 'virtual:platform';

import { newSpecPage } from '../../testing/spec-page';
import { bootstrapLazy } from '../bootstrap-loader';

describe('bootstrap lazy', () => {
  it('should not inject invalid CSS when no lazy bund§les are provided', () => {
    const spy = vi.spyOn(win.document.head, 'insertBefore');

    bootstrapLazy([]);

    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sheet: expect.objectContaining({
          cssRules: [
            expect.objectContaining({
              // This html is not valid since it does not start with a selector for the visibility hidden block
              cssText: '{visibility:hidden}.hydrated{visibility:inherit}',
            }),
          ],
        }),
      }),
      null,
    );
  });

  it('should not inject invalid CSS when components are already in custom element registry', () => {
    const spy = vi.spyOn(win.document.head, 'insertBefore');

    const lazyBundles: LazyBundlesRuntimeData = [
      ['my-component', [[0, 'my-component', { first: [1], middle: [1], last: [1] }]]],
    ];

    bootstrapLazy(lazyBundles);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        sheet: expect.objectContaining({
          cssRules: [
            expect.objectContaining({
              cssText: 'my-component{visibility:hidden}.hydrated{visibility:inherit}',
            }),
          ],
        }),
      }),
      null,
    );

    bootstrapLazy(lazyBundles);
    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sheet: expect.objectContaining({
          cssRules: [
            expect.objectContaining({
              // This html is not valid since it does not start with a selector for the visibility hidden block
              cssText: '{visibility:hidden}.hydrated{visibility:inherit}',
            }),
          ],
        }),
      }),
      null,
    );
  });

  describe('disconnectedCallback', () => {
    it('cleans up host references without waiting on requestAnimationFrame', async () => {
      @Component({ tag: 'leak-cmp' })
      class LeakCmp {}

      // a hidden tab never runs rAF callbacks - mock it to never invoke its
      // callback to prove cleanup doesn't depend on one ever firing
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame').mockImplementation(() => 0);

      const { root, waitForChanges } = await newSpecPage({
        components: [LeakCmp],
        html: `<leak-cmp></leak-cmp>`,
      });

      const hostRef = getHostRef(root)!;
      expect(hostRef.$vnode$?.$elm$).toBe(root);

      root.remove();
      expect(hostRef.$vnode$?.$elm$).toBe(root);

      await waitForChanges();

      expect(hostRef.$vnode$?.$elm$).toBeUndefined();
      expect(rafSpy).not.toHaveBeenCalled();

      rafSpy.mockRestore();
    });
  });
});
