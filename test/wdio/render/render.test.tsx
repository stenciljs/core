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
    await expect($(document.body).$('div')).toMatchInlineSnapshot(`
      "<div>
        <complex-properties class="hydrated">
          <template shadowrootmode="open">
            <style>h2 { font-size: 16px; color: red; }h2::after { content: ": from global-css-entry.css"; }:host { display: block; margin: 10px; padding: 20px; border: 5px dotted red; }h1 { font-size: 18px; color: maroon; display: flex; }h1::after { content:": from global-sass-entry.scss"; }</style>
            <ul>
              <li>this.foo.bar: 123</li>
              <li>this.foo.loo: 1, 2, 3</li>
              <li>this.foo.qux: symbol</li>
              <li>this.baz.get('foo'): symbol</li>
              <li>this.quux.has('foo'): true</li>
              <li>this.grault: true</li>
              <li>this.waldo: true</li>
              <li>this.kidsNames: John, Jane, Jim</li>
            </ul>
          </template>
        </complex-properties>
      </div>"
    `);
  });
});
