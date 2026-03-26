import { render, h, describe, it, expect } from '@stencil/vitest';

describe('static-members', () => {
  it('renders properly with initialized static members', async () => {
    const { root } = await render(<static-members />);
    const div = root.querySelector('div')!;
    expect(div).toHaveTextContent('This is a component with static public and private members');
  });

  it('renders properly with initialized, decorated static members', async () => {
    const { root } = await render(<static-decorated-members />);
    const div = root.querySelector('div')!;
    expect(div).toHaveTextContent('This is a component with a static Stencil decorated member');
  });

  it('renders properly with a separate export', async () => {
    const { root } = await render(<static-members-separate-export />);
    const div = root.querySelector('div')!;
    expect(div).toHaveTextContent('This is a component with static public and private members');
  });

  it('renders properly with a static member initialized outside of a class', async () => {
    const { root } = await render(<static-members-separate-initializer />);
    const div = root.querySelector('div')!;
    expect(div).toHaveTextContent(
      'This is a component with static an externally initialized member',
    );
  });
});
