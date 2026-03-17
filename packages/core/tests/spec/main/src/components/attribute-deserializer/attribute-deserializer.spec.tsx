import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('attribute-deserializer', () => {
  it('correctly deserializes basic attributes', async () => {
    const { root, waitForChanges } = await render<HTMLAttributeDeserializerElement>(
      `<attribute-deserializer bool array="[1,2,3]" json='{"foo":"bar"}' get-set='{"foo":"bar"}'></attribute-deserializer>`
    );
    await waitForExist('attribute-deserializer.hydrated');

    expect(root.bool).toBe(true);
    expect(root.array).toEqual([1, 2, 3]);
    expect(root.json).toEqual({ foo: 'bar' });
    // Watchers don't fire on initial load (per lifecycle docs)
    expect(await root.getBools()).toEqual([]);
    expect(await root.getArray()).toEqual([]);
    expect(await root.getJson()).toEqual([]);

    root.removeAttribute('bool');
    root.removeAttribute('array');
    root.removeAttribute('json');
    await waitForChanges();

    expect(root.bool).toBe(false);
    expect(root.array).toEqual(null);
    expect(root.json).toEqual(null);
    // Watchers fire on subsequent changes
    expect(await root.getBools()).toEqual([false]);
    expect(await root.getArray()).toEqual([null]);
    expect(await root.getJson()).toEqual([null]);

    root.setAttribute('bool', 'false');
    root.setAttribute('array', 'invalid json');
    root.setAttribute('json', 'invalid json');

    expect(root.bool).toBe(false);
    expect(root.array).toEqual(null);
    expect(root.json).toEqual(null);
    expect(await root.getBools()).toEqual([false]);
    expect(await root.getArray()).toEqual([null]);
    expect(await root.getJson()).toEqual([null]);

    root.setAttribute('bool', 'true');
    root.setAttribute('array', '["a","b","c"]');
    root.setAttribute('json', '{"bar":"baz"}');

    expect(root.bool).toBe(true);
    expect(root.array).toEqual(['a', 'b', 'c']);
    expect(root.json).toEqual({ bar: 'baz' });
    expect(await root.getBools()).toEqual([false, true]);
    expect(await root.getArray()).toEqual([null, ['a', 'b', 'c']]);
    expect(await root.getJson()).toEqual([null, { bar: 'baz' }]);
  });

  it('correctly deserializes get / set properties in the correct order', async () => {
    const { root, waitForChanges } = await render<HTMLAttributeDeserializerElement>(
      `<attribute-deserializer bool array="[1,2,3]" json='{"foo":"bar"}' get-set='{"foo":"bar"}'></attribute-deserializer>`
    );
    await waitForExist('attribute-deserializer.hydrated');


    expect(root.getSet).toEqual({ foo: 'bar' });
    // On initial load: deserializer ('1.') and setter ('2.') fire, but NOT watcher ('3.')
    expect(await root.getGetSet()).toEqual(['1.', '{"foo":"bar"}', '2.', { foo: 'bar' }]);

    root.setAttribute('get-set', '{"bar":"baz"}');
    await waitForChanges();

    // On subsequent change: deserializer, setter, AND watcher all fire
    expect(await root.getGetSet()).toEqual([
      '1.',
      '{"foo":"bar"}',
      '2.',
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
