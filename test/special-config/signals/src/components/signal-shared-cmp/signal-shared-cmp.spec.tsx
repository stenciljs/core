import { render, h, describe, it, expect } from '@stencil/vitest';

describe('shared/external signals', () => {
  it('renders the initial shared signal values in both parent and child', async () => {
    const { root } = await render<HTMLSignalSharedParentElement>(<signal-shared-parent />);
    await root.setCount(0);
    await root.setLabel('hello');

    expect(root.querySelector('.parent-count')).toHaveTextContent('0');
    expect(root.querySelector('.child-count')).toHaveTextContent('0');
    expect(root.querySelector('.parent-label')).toHaveTextContent('hello');
    expect(root.querySelector('.child-label')).toHaveTextContent('hello');
  });

  it('updating the signal via method updates both parent and child DOM', async () => {
    const { root } = await render<HTMLSignalSharedParentElement>(<signal-shared-parent />);

    await root.setCount(42);
    expect(root.querySelector('.parent-count')).toHaveTextContent('42');
    expect(root.querySelector('.child-count')).toHaveTextContent('42');
  });

  it('updating the signal directly updates both parent and child DOM', async () => {
    const { root } = await render<HTMLSignalSharedParentElement>(<signal-shared-parent />);

    const label = await root.getLabelSignal();
    label.value = 'world';
    expect(root.querySelector('.parent-label')).toHaveTextContent('world');
    expect(root.querySelector('.child-label')).toHaveTextContent('world');
  });

  it('multiple independent updates propagate correctly', async () => {
    const { root } = await render<HTMLSignalSharedParentElement>(<signal-shared-parent />);

    await root.setCount(1);
    await root.setLabel('updated');
    await root.setCount(2);

    expect(root.querySelector('.parent-count')).toHaveTextContent('2');
    expect(root.querySelector('.child-count')).toHaveTextContent('2');
    expect(root.querySelector('.parent-label')).toHaveTextContent('updated');
    expect(root.querySelector('.child-label')).toHaveTextContent('updated');
  });
});
