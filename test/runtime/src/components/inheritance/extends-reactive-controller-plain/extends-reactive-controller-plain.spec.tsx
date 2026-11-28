import { describe, it, expect, render, beforeEach } from '@stencil/vitest';

/**
 * Regression test for the `isPlain` fast path silently dropping an inherited
 * `connectedCallback` when the only thing that would make a component "non-plain"
 * lives in a mixin the compiler can't introspect (see component-build-conditionals.ts).
 */
describe('extends-reactive-controller-plain', () => {
  beforeEach(() => {
    delete (window as any).__extendsReactiveControllerPlainConnected;
  });

  it('still calls the mixed-in connectedCallback (and hostConnected) despite having no own members', async () => {
    const { root } = await render(<extends-reactive-controller-plain-cmp />);

    expect((window as any).__extendsReactiveControllerPlainConnected).toBe(true);
    expect(root.textContent).toBe('plain content');
  });
});
