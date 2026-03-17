import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-replace-wrapper', () => {
  it('renders A', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);

    // Wait for componentDidLoad to set href
    await waitForChanges();

    const result = root.querySelector('.results1 a')!;
    expect(result.textContent!.trim()).toBe('A');
    expect(result.children[0].textContent!.trim()).toBe('A');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders B', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results2 a')!;
    expect(result.textContent!.trim()).toBe('B');
    expect(result.children[0].children[0].textContent!.trim()).toBe('B');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders C', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results3 a')!;
    expect(result.textContent!.trim()).toBe('C');
    expect(result.children[0].children[0].children[0].textContent!.trim()).toBe('C');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders ABC from ABC', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results4 a')!;
    expect(result.textContent!.trim()).toBe('ABC');
    expect(result.children[0].textContent!.trim()).toBe('A');
    expect(result.children[1].children[0].textContent!.trim()).toBe('B');
    expect(result.children[1].children[1].children[0].textContent!.trim()).toBe('C');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders ABC from BCA', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results5 a')!;
    expect(result.textContent!.trim()).toBe('ABC');
    expect(result.children[0].textContent!.trim()).toBe('A');
    expect(result.children[1].children[0].textContent!.trim()).toBe('B');
    expect(result.children[1].children[1].children[0].textContent!.trim()).toBe('C');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders ABC from CAB', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results6 a')!;
    expect(result.textContent!.trim()).toBe('ABC');
    expect(result.children[0].textContent!.trim()).toBe('A');
    expect(result.children[1].children[0].textContent!.trim()).toBe('B');
    expect(result.children[1].children[1].children[0].textContent!.trim()).toBe('C');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders A1A2B1B2C1C2 from A1A2B1B2C1C2', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results7 a')!;
    expect(result.textContent!.trim()).toBe('A1A2B1B2C1C2');

    expect(root.querySelector('[hidden]')).toBeNull();
  });

  it('renders A1A2B1B2C1C2 from B1C1A1B2C2A2', async () => {
    const { root, waitForChanges } = await render(<slot-replace-wrapper-root />);
    await waitForChanges();

    const result = root.querySelector('.results8 a')!;
    expect(result.textContent!.trim()).toBe('A1A2B1B2C1C2');

    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
