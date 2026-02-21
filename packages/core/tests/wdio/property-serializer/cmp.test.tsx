import { render, waitForChanges } from '@wdio/browser-runner/stencil';
import { expect } from '@wdio/globals';

describe('prop-serializer', () => {
  before(async () => {
    render({
      html: `<prop-serializer></prop-serializer>`,
      components: [],
    });
  });

  it('correctly serializes baisc properties', async () => {
    const root = document.body.querySelector('prop-serializer');
    await root.reset();
    await waitForChanges();
    root.boolOrSomething = true;
    await waitForChanges();
    expect(root.getAttribute('bool-or-something')).toBe('true');
    root.boolOrSomething = false;
    await waitForChanges();
    expect(root.getAttribute('bool-or-something')).toBe(null);
    root.boolOrSomething = 'hello';
    await waitForChanges();
    expect(root.getAttribute('bool-or-something')).toBe('hello');
    root.boolOrSomething = 0;
    await waitForChanges();
    expect(root.getAttribute('bool-or-something')).toBe(null);
    expect(await root.getBools()).toEqual([true, false, 'hello', 0]);

    root.array = ['1', '2', '3'];
    root.json = { foo: 'bar' };
    await waitForChanges();
    expect(root.getAttribute('array')).toBe('["1","2","3"]');
    expect(root.getAttribute('json')).toBe('{"foo":"bar"}');

    expect(await root.getArray()).toEqual([['1', '2', '3']]);
    expect(await root.getJson()).toEqual([{ foo: 'bar' }]);
  });

  it('correctly serializes get / set properties in the correct order', async () => {
    const root = document.body.querySelector('prop-serializer');
    await root.reset();
    root.getSet = { foo: 'bar' };
    expect(root.getAttribute('get-set')).toEqual(JSON.stringify({ foo: 'bar' }));
    // hits the setter first
    // then the serializer
    // then the watcher
    expect(await root.getGetSet()).toEqual(['1.', { foo: 'bar' }, '2.', { foo: 'bar' }, '3.', { foo: 'bar' }]);

    root.getSet = { bar: 'baz' };
    // hits the setter first
    // then the serializer
    // then the watcher
    expect(await root.getGetSet()).toEqual([
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
    const root = document.body.querySelector('prop-serializer');
    root.nonReflect = 'no attribute';
    await waitForChanges();
    expect(root.getAttribute('non-reflect')).toBe(null);
    expect(root.nonReflect).toBe('no attribute');
  });
});
