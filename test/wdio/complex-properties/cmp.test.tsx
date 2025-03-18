/// <reference types="../dist/components.d.ts" />
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

import { renderToString, serializeProperty } from '../hydrate/index.mjs';

const template = `<complex-properties
  foo=${serializeProperty({ bar: 123, loo: [1, 2, 3], qux: { quux: Symbol('quux') } })}
  baz=${serializeProperty(new Map([['foo', { qux: Symbol('quux') }]]))}
  quux=${serializeProperty(new Set(['foo']))}
  corge=${serializeProperty(new Set([{ foo: { bar: 'foo' } }]))}
  grault=${serializeProperty(Infinity)}
  waldo=${serializeProperty(null)}
/>`;

describe('complex-properties', () => {
  it('should render complex properties', async () => {
    const { html } = await renderToString(template, {
      prettyHtml: true,
      fullDocument: false,
    });
    expect(html).toMatchSnapshot();
  });

  it('can render component and update properties', async () => {
    const { html } = await renderToString(template, {
      fullDocument: false,
    });

    render({ html, components: [] });
    await expect($('complex-properties')).toHaveText(
      [
        `this.foo.bar: 123`,
        `this.foo.loo: 1, 2, 3`,
        `this.foo.qux: symbol`,
        `this.baz.get('foo'): symbol`,
        `this.quux.has('foo'): true`,
        `this.grault: true`,
        `this.waldo: true`,
      ].join('\n'),
    );
  });

  it('can change a complex property and see it updated correctly', async () => {
    const elm = document.querySelector('complex-properties') as HTMLComplexPropertiesElement;
    elm.foo = { bar: '456', loo: [4, 5, 6], qux: { quux: Symbol('new quux') } };
    await expect(elm).toHaveText(
      expect.stringContaining([
        `this.foo.bar: 456`,
        `this.foo.loo: 4, 5, 6`,
        `this.foo.qux: symbol`,
      ].join('\n')),
    );
  });
});
