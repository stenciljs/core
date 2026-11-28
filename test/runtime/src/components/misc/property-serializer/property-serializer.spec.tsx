import { render, h, describe, it, expect } from '@stencil/vitest';

describe('prop-serializer', () => {
  it('correctly serializes basic properties', async () => {
    const { root, waitForChanges } = await render(<prop-serializer />);
    const cmp = root as HTMLPropSerializerElement;

    await cmp.reset();
    await waitForChanges();

    cmp.boolOrSomething = true;
    await waitForChanges();
    expect(cmp.getAttribute('bool-or-something')).toBe('true');

    cmp.boolOrSomething = false;
    await waitForChanges();
    expect(cmp.getAttribute('bool-or-something')).toBe(null);

    cmp.boolOrSomething = 'hello';
    await waitForChanges();
    expect(cmp.getAttribute('bool-or-something')).toBe('hello');

    cmp.boolOrSomething = 0;
    await waitForChanges();
    expect(cmp.getAttribute('bool-or-something')).toBe(null);

    expect(await cmp.getBools()).toEqual([true, false, 'hello', 0]);

    cmp.array = ['1', '2', '3'];
    cmp.json = { foo: 'bar' };
    await waitForChanges();
    expect(cmp.getAttribute('array')).toBe('["1","2","3"]');
    expect(cmp.getAttribute('json')).toBe('{"foo":"bar"}');

    expect(await cmp.getArray()).toEqual([['1', '2', '3']]);
    expect(await cmp.getJson()).toEqual([{ foo: 'bar' }]);
  });

  it('correctly serializes get / set properties in the correct order', async () => {
    const { root, waitForChanges } = await render(<prop-serializer />);
    const cmp = root as HTMLPropSerializerElement;

    await cmp.reset();
    await waitForChanges();

    cmp.getSet = { foo: 'bar' };
    await waitForChanges();
    expect(cmp.getAttribute('get-set')).toEqual(JSON.stringify({ foo: 'bar' }));
    // hits the setter first
    // then the serializer
    // then the watcher
    expect(await cmp.getGetSet()).toEqual([
      '1.',
      { foo: 'bar' },
      '2.',
      { foo: 'bar' },
      '3.',
      { foo: 'bar' },
    ]);

    cmp.getSet = { bar: 'baz' };
    await waitForChanges();
    // hits the setter first
    // then the serializer
    // then the watcher
    expect(await cmp.getGetSet()).toEqual([
      '1.',
      { foo: 'bar' },
      '2.',
      { foo: 'bar' },
      '3.',
      { foo: 'bar' },
      '1.',
      { bar: 'baz' },
      '2.',
      { bar: 'baz' },
      '3.',
      { bar: 'baz' },
    ]);
  });

  it('does not affect `reflect: false` properties', async () => {
    const { root, waitForChanges } = await render(<prop-serializer />);
    const cmp = root as HTMLPropSerializerElement;

    cmp.nonReflect = 'no attribute';
    await waitForChanges();
    expect(cmp.getAttribute('non-reflect')).toBe(null);
    expect(cmp.nonReflect).toBe('no attribute');
  });
});
