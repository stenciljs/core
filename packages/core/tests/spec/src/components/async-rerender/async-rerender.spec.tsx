import { render, h, describe, it, expect, waitForStable } from '@stencil/vitest';
import { page } from 'vitest/browser';

describe('asynchronous re-rendering', () => {
  it('button click re-renders', async () => {
    const { root, waitForChanges } = await render(<async-rerender />);
    
    await waitForStable('.number');
    const listItems1 = root.querySelectorAll<HTMLElement>('.number');
    expect(listItems1.length).toBe(10);

    const buttons = root.querySelectorAll('button');
   
    buttons[0].click();
    await waitForChanges();
    await waitForStable('async-rerender .loaded');
    const listItems2 = root.querySelectorAll('.number');
    expect(listItems2.length).toBe(5);

    buttons[1].click();
    await waitForChanges();
    await waitForStable('async-rerender .loaded');

    const listItems3 = root.querySelectorAll<HTMLElement>('.number');
    expect(listItems3.length).toBe(10);
  });
});
