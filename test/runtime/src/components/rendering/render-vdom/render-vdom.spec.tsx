import { render } from '@stencil/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('render-vdom', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('preserves DOM elements when re-rendering to the same container', () => {
    // Initial render with three items
    render(
      <ul>
        <li key='a'>Alpha</li>
        <li key='b'>Beta</li>
        <li key='c'>Gamma</li>
      </ul>,
      container,
    );

    const ul = container.querySelector('ul')!;
    const originalLi = ul.querySelector('li:nth-child(2)')!;
    expect(ul.children.length).toBe(3);

    // Re-render with a modified list: remove "Beta", add "Delta"
    render(
      <ul>
        <li key='a'>Alpha</li>
        <li key='c'>Gamma</li>
        <li key='d'>Delta</li>
      </ul>,
      container,
    );

    // The <ul> element should be the SAME DOM node (not recreated)
    const ulAfter = container.querySelector('ul')!;
    expect(ulAfter).toBe(ul);

    // The list should reflect the new children
    expect(ulAfter.children.length).toBe(3);
    expect(ulAfter.children[0].textContent).toBe('Alpha');
    expect(ulAfter.children[1].textContent).toBe('Gamma');
    expect(ulAfter.children[2].textContent).toBe('Delta');

    // "Beta" should no longer be in the DOM
    expect(originalLi.parentNode).toBeFalsy();
  });

  it('preserves input state across re-renders', () => {
    // Initial render with an input element
    render(
      <div>
        <input type='text' id='test-input' />
        <span>count: 1</span>
      </div>,
      container,
    );

    const input = container.querySelector('#test-input') as HTMLInputElement;
    // Simulate user typing — this is internal DOM state not controlled by VDOM
    input.value = 'user typed this';

    // Re-render with updated content but same input
    render(
      <div>
        <input type='text' id='test-input' />
        <span>count: 2</span>
      </div>,
      container,
    );

    // The input should be the SAME element with user's value preserved
    const inputAfter = container.querySelector('#test-input') as HTMLInputElement;
    expect(inputAfter).toBe(input);
    expect(inputAfter.value).toBe('user typed this');

    // The span should be updated
    expect(container.querySelector('span')!.textContent).toBe('count: 2');
  });
});
