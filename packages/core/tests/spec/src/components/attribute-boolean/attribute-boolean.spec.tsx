import { render, h, describe, it, expect } from '@stencil/vitest';

describe('attribute-boolean', () => {
  it('button click rerenders', async () => {
    const { root, waitForChanges } = await render(<attribute-boolean-root />);

    expect(root).toHaveAttribute('aria-hidden', 'false');
    expect(root).toHaveAttribute('fixedtrue', 'true');
    expect(root).toHaveAttribute('fixedfalse', 'false');
    expect(root).not.toHaveAttribute('readonly');
    expect(root).not.toHaveAttribute('tappable');
    expect(root).not.toHaveAttribute('str');
    expect(root).not.toHaveAttribute('no-appear');
    expect(root).not.toHaveAttribute('no-appear-two');

    const child = root.querySelector('attribute-boolean')!;
    expect(child).toHaveAttribute('aria-hidden', 'false');
    expect(child).toHaveAttribute('str-state', 'false');
    expect(child).not.toHaveAttribute('bool-state');
    expect(child).not.toHaveAttribute('noreflect');
    expect(child).not.toHaveAttribute('tappable');

    const button = root.querySelector('button')!;
    button.click();
    await waitForChanges();

    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveAttribute('fixedtrue', 'true');
    expect(root).toHaveAttribute('fixedfalse', 'false');
    expect(root).toHaveAttribute('readonly');
    expect(root).toHaveAttribute('tappable', '');
    expect(root).toHaveAttribute('str', 'hello');
    expect(root).not.toHaveAttribute('no-appear');
    expect(root).not.toHaveAttribute('no-appear-two');

    expect(child).toHaveAttribute('aria-hidden', 'true');
    expect(child).toHaveAttribute('str-state', 'true');
    expect(child).toHaveAttribute('bool-state', '');
    expect(child).not.toHaveAttribute('noreflect');
    expect(child).toHaveAttribute('tappable', '');
  });
});