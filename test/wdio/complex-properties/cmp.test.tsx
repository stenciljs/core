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
/>`

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
    const stage = document.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    document.body.appendChild(stage);

    render({ html, components: [] });
    await expect($('complex-properties')).toHaveText([
      `this.foo.bar: 123`,
      `this.foo.loo: 1, 2, 3`,
      `this.foo.qux: symbol`,
      `this.baz.get('foo'): symbol`,
      `this.quux.has('foo'): true`,
      `this.grault: true`,
      `this.waldo: true`,
    ].join('\n'));
  });
});
