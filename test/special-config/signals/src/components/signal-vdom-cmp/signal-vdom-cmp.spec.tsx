import { render, describe, it, expect } from '@stencil/vitest';

describe('signal-vdom-cmp (vdom bypass)', () => {
  it('renders the initial signal values', async () => {
    const { root } = await render<HTMLSignalVdomCmpElement>(<signal-vdom-cmp />);
    const text = await root.getTextSignal();
    const cls = await root.getClassSignal();
    text.value = 'initial';
    cls.value = 'before';

    expect(root.querySelector('.text')).toHaveTextContent('initial');
    expect(root.querySelector('div[class]')).toHaveAttribute('class', 'before');
  });

  it('updates text content when signal changes without re-rendering', async () => {
    const { root } = await render<HTMLSignalVdomCmpElement>(<signal-vdom-cmp />);
    const text = await root.getTextSignal();

    const rendersBefore = await root.getRenderCount();
    text.value = 'updated';

    expect(root.querySelector('.text')).toHaveTextContent('updated');
    expect(await root.getRenderCount()).toBe(rendersBefore);
  });

  it('updates class attribute when signal changes without re-rendering', async () => {
    const { root } = await render<HTMLSignalVdomCmpElement>(<signal-vdom-cmp />);
    const cls = await root.getClassSignal();

    const rendersBefore = await root.getRenderCount();
    cls.value = 'after';

    expect(root.querySelector('.after')).not.toBeNull();
    expect(await root.getRenderCount()).toBe(rendersBefore);
  });

  it('multiple signal updates each reflect in DOM', async () => {
    const { root } = await render<HTMLSignalVdomCmpElement>(<signal-vdom-cmp />);
    const text = await root.getTextSignal();

    text.value = 'one';
    expect(root.querySelector('.text')).toHaveTextContent('one');

    text.value = 'two';
    expect(root.querySelector('.text')).toHaveTextContent('two');
  });
});
