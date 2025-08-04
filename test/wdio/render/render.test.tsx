import { h, render } from '@stencil/core';
import { $, expect } from '@wdio/globals';

import { defineCustomElement } from '../test-components/complex-properties.js';

describe('Render VDOM', () => {
  beforeEach(async () => {
    document.querySelector('div')?.remove();
  });

  it('can render an arbitrary VDOM tree', async () => {
    const vdom = h('div', { className: 'test' }, 'Hello, world!');
    render(vdom, document.body);

    await expect($(document.body).$('div')).toMatchInlineSnapshot(`"<div class="test">Hello, world!</div>"`);
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
    render(vdom, document.body);

    // Use separate assertions instead of inline snapshot to avoid framework issues
    const component = await $('complex-properties');
    await expect(component).toExist();
    await expect(component).toHaveElementClass('hydrated');

    // Verify each prop value is rendered correctly
    const listItems = await component.$$('li');
    await expect(listItems[0]).toHaveText('this.foo.bar: 123');
    await expect(listItems[1]).toHaveText('this.foo.loo: 1, 2, 3');
    await expect(listItems[2]).toHaveText('this.foo.qux: symbol');
    await expect(listItems[3]).toHaveText("this.baz.get('foo'): symbol");
    await expect(listItems[4]).toHaveText("this.quux.has('foo'): true");
    await expect(listItems[5]).toHaveText('this.grault: true');
    await expect(listItems[6]).toHaveText('this.waldo: true');
    await expect(listItems[7]).toHaveText('this.kidsNames: John, Jane, Jim');
  });
});
