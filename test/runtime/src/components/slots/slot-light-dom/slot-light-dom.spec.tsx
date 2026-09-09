import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-light-dom', () => {
  it('renders light dom in correct slots', async () => {
    const { root, waitForChanges } = await render(<slot-light-dom-root />);

    // Initial render with lowercase values
    expect(root.querySelector('.results1 article')!.textContent).toBe('a');
    expect(root.querySelector('.results2 article')!.textContent).toBe('b');
    expect(root.querySelector('.results3 article nav')!.textContent).toBe('c');
    expect(root.querySelector('.results4 article nav')!.textContent).toBe('d');
    expect(root.querySelector('.results4 article')!.textContent).toBe('de');
    expect(root.querySelector('.results5 article')!.textContent).toBe('fg');
    expect(root.querySelector('.results5 article nav')!.textContent).toBe('g');
    expect(root.querySelector('.results6 article')!.textContent).toBe('hij');
    expect(root.querySelector('.results6 article nav')!.textContent).toBe('i');
    expect(root.querySelector('.results7 article')!.textContent).toBe('klm');

    let navs = root.querySelectorAll('.results7 article nav');
    expect(navs[0].textContent).toBe('k');
    expect(navs[1].textContent).toBe('l');
    expect(navs[2].textContent).toBe('m');

    // Click to change to uppercase
    root.querySelector('button')!.click();
    await waitForChanges();

    expect(root.querySelector('.results1 article')!.textContent).toBe('A');
    expect(root.querySelector('.results2 article')!.textContent).toBe('B');
    expect(root.querySelector('.results3 article nav')!.textContent).toBe('C');
    expect(root.querySelector('.results4 article nav')!.textContent).toBe('D');
    expect(root.querySelector('.results4 article')!.textContent).toBe('DE');
    expect(root.querySelector('.results5 article')!.textContent).toBe('FG');
    expect(root.querySelector('.results5 article nav')!.textContent).toBe('G');
    expect(root.querySelector('.results6 article')!.textContent).toBe('HIJ');
    expect(root.querySelector('.results6 article nav')!.textContent).toBe('I');
    expect(root.querySelector('.results7 article')!.textContent).toBe('KLM');

    navs = root.querySelectorAll('.results7 article nav');
    expect(navs[0].textContent).toBe('K');
    expect(navs[1].textContent).toBe('L');
    expect(navs[2].textContent).toBe('M');

    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
