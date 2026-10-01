import { render, h, describe, it, expect } from '@stencil/vitest';

describe('computed-properties-state-decorator', () => {
  it('correctly sets computed property `@State()`s and triggers re-renders', async () => {
    const { root, waitForChanges } = await render(<computed-properties-state-decorator />);

    const div = root.querySelector('div')!;
    expect(div).toHaveTextContent('Has rendered: false');
    expect(div).toHaveTextContent('Mode: default');

    const cmp = root as HTMLComputedPropertiesStateDecoratorElement;
    await cmp.changeStates();
    await waitForChanges();

    expect(div).toHaveTextContent('Has rendered: true');
    expect(div).toHaveTextContent('Mode: super');
  });
});
