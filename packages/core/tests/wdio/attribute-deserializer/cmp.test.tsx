import { render, waitForChanges } from '@wdio/browser-runner/stencil';
import { expect } from '@wdio/globals';

describe('attribute-deserializer', () => {
  before(async () => {
    render({
      html: `<attribute-deserializer bool array="[1,2,3]" json='{"foo":"bar"}' get-set='{"foo":"bar"}'></attribute-deserializer>`,
      components: [],
    });
  });

  it('correctly deserializes basic attributes', async () => {
    const root = document.body.querySelector('attribute-deserializer');
    await waitForChanges();
    expect(root.bool).toBe(true);
    expect(root.array).toEqual([1, 2, 3]);
    expect(root.json).toEqual({ foo: 'bar' });
    expect(await root.getBools()).toEqual([true]);
    expect(await root.getArray()).toEqual([[1, 2, 3]]);
    expect(await root.getJson()).toEqual([{ foo: 'bar' }]);

    root.removeAttribute('bool');
    root.removeAttribute('array');
    root.removeAttribute('json');

    expect(root.bool).toBe(false);
    expect(root.array).toEqual(null);
    expect(root.json).toEqual(null);
    expect(await root.getBools()).toEqual([true, false]);
    expect(await root.getArray()).toEqual([[1, 2, 3], null]);
    expect(await root.getJson()).toEqual([{ foo: 'bar' }, null]);

    root.setAttribute('bool', 'false');
    root.setAttribute('array', 'invalid json');
    root.setAttribute('json', 'invalid json');

    expect(root.bool).toBe(false);
    expect(root.array).toEqual(null);
    expect(root.json).toEqual(null);
    expect(await root.getBools()).toEqual([true, false]);
    expect(await root.getArray()).toEqual([[1, 2, 3], null]);
    expect(await root.getJson()).toEqual([{ foo: 'bar' }, null]);

    root.setAttribute('bool', 'true');
    root.setAttribute('array', '["a","b","c"]');
    root.setAttribute('json', '{"bar":"baz"}');

    expect(root.bool).toBe(true);
    expect(root.array).toEqual(['a', 'b', 'c']);
    expect(root.json).toEqual({ bar: 'baz' });
    expect(await root.getBools()).toEqual([true, false, true]);
    expect(await root.getArray()).toEqual([[1, 2, 3], null, ['a', 'b', 'c']]);
    expect(await root.getJson()).toEqual([{ foo: 'bar' }, null, { bar: 'baz' }]);
  });

  it('correctly deserializes get / set properties in the correct order', async () => {
    const root = document.body.querySelector('attribute-deserializer');
    expect(root.getSet).toEqual({ foo: 'bar' });
    // hits the deserializer first
    // then the setter
    // then the watcher
    expect(await root.getGetSet()).toEqual(['1.', '{"foo":"bar"}', '2.', { foo: 'bar' }, '3.', { foo: 'bar' }]);

    root.setAttribute('get-set', '{"bar":"baz"}');
    await waitForChanges();
    // hits the deserializer first
    // then the setter
    // then the watcher
    expect(await root.getGetSet()).toEqual([
      '1.',
      '{"foo":"bar"}',
      '2.',
      { foo: 'bar' },
      '3.',
      { foo: 'bar' },
      '1.',
      '{"bar":"baz"}',
      '2.',
      { bar: 'baz' },
      '3.',
      { bar: 'baz' },
    ]);
  });
});
