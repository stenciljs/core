import { h, render } from '@stencil/core';
import { $, expect } from '@wdio/globals';

import { defineCustomElement } from '../test-components/complex-properties.js';

describe('Render VDOM', () => {
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    container.remove();
  });

  it('can render an arbitrary VDOM tree', async () => {
    const vdom = h('div', { className: 'test' }, 'Hello, world!');
    render(vdom, container);

    await expect($(container).$('div')).toMatchInlineSnapshot(`"<div class="test">Hello, world!</div>"`);
  });

  it('can render a VDOM with a Stencil component', async () => {
    defineCustomElement();

    const vdom = (
      <div>
        <complex-properties
          foo={{ bar: 123, loo: [1, 2, 3], qux: { quux: Symbol('quux') } }}
          baz={new Map([['foo', { qux: Symbol('quux') }]])}
          quux={new Set(['foo'])}
          corge={new Set([{ foo: { bar: 'foo' } }])}
          grault={Infinity}
          waldo={null}
          kidsNames={['John', 'Jane', 'Jim']}
        ></complex-properties>
      </div>
    );
    render(vdom, container);

    // Use separate assertions instead of inline snapshot to avoid framework issues
    const component = await $('complex-properties');
    await expect(component).toExist();
    await expect(component).toHaveElementClass('hydrated');

    // Verify each prop value is rendered correctly
    const listItems = await component.shadow$$('li');
    await expect(listItems[0]).toHaveText('this.foo.bar: 123');
    await expect(listItems[1]).toHaveText('this.foo.loo: 1, 2, 3');
    await expect(listItems[2]).toHaveText('this.foo.qux: symbol');
    await expect(listItems[3]).toHaveText("this.baz.get('foo'): symbol");
    await expect(listItems[4]).toHaveText("this.quux.has('foo'): true");
    await expect(listItems[5]).toHaveText('this.grault: true');
    await expect(listItems[6]).toHaveText('this.waldo: true');
    await expect(listItems[7]).toHaveText('this.kidsNames: John, Jane, Jim');
  });

  it('preserves DOM elements when re-rendering to the same container', async () => {
    // Initial render with three items
    render(
      <ul>
        <li key="a">Alpha</li>
        <li key="b">Beta</li>
        <li key="c">Gamma</li>
      </ul>,
      container,
    );

    const ul = container.querySelector('ul')!;
    const originalLi = ul.querySelector('li:nth-child(2)')!;
    expect(ul.children.length).toBe(3);

    // Re-render with a modified list: remove "Beta", add "Delta"
    render(
      <ul>
        <li key="a">Alpha</li>
        <li key="c">Gamma</li>
        <li key="d">Delta</li>
      </ul>,
      container,
    );

    // The <ul> element should be the SAME DOM node (not recreated)
    const ulAfter = container.querySelector('ul')!;
    expect(ulAfter).toBe(ul);

    // The list should reflect the new children
    expect(ulAfter.children.length).toBe(3);
    await expect($(ulAfter.children[0])).toHaveText('Alpha');
    await expect($(ulAfter.children[1])).toHaveText('Gamma');
    await expect($(ulAfter.children[2])).toHaveText('Delta');

    // "Beta" should no longer be in the DOM
    expect(originalLi.parentNode).toBeFalsy();
  });

  it('preserves custom element state across re-renders', async () => {
    // Initial render with an input element
    render(
      <div>
        <input type="text" id="test-input" />
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
        <input type="text" id="test-input" />
        <span>count: 2</span>
      </div>,
      container,
    );

    // The input should be the SAME element with user's value preserved
    const inputAfter = container.querySelector('#test-input') as HTMLInputElement;
    expect(inputAfter).toBe(input);
    expect(inputAfter.value).toBe('user typed this');

    // The span should be updated
    await expect($(container.querySelector('span')!)).toHaveText('count: 2');
  });
});
