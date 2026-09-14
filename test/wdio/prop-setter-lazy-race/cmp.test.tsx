import { expect } from '@wdio/globals';

describe('getter/setter @Prop write ordering before first render', () => {
  it('the last write before first render wins, same as a plain @Prop', async () => {
    // Render a first instance so its module is loaded and cached
    const warmup = document.createElement('prop-setter-lazy-race');
    document.body.appendChild(warmup);
    await warmup.componentOnReady();

    const el = document.createElement('prop-setter-lazy-race') as any;

    // Writes land before the element is connected, so the lazy
    // instance doesn't exist yet - they're queued to be replayed once ready
    el.isReadonly = true;
    el.plainReadonly = true;

    document.body.appendChild(el);

    // Module already cached, `connectedCallback` constructs
    // the lazy instance synchronously - but the queued writes
    // above are only replayed on a later microtask (during first render).
    // So these writes land directly on the already-constructed instance, and
    // should be the ones that stick.
    el.isReadonly = false;
    el.plainReadonly = false;

    await el.componentOnReady();

    expect(el.plainReadonly).toBe(false);
    expect(el.isReadonly).toBe(false);
    expect(el.hasAttribute('is-readonly')).toBe(false);
  });

  it('the last attribute write before first render wins, even when it equals the prop default', async () => {
    // Render a first instance so its module is loaded and cached
    const warmup = document.createElement('prop-setter-lazy-race');
    document.body.appendChild(warmup);
    await warmup.componentOnReady();

    const el = document.createElement('prop-setter-lazy-race') as any;

    // Attribute write lands before the element is connected, so the lazy
    // instance doesn't exist yet - it's queued to be replayed once ready
    el.setAttribute('is-readonly', '');

    document.body.appendChild(el);

    // Module already cached, `connectedCallback` constructs the lazy
    // instance synchronously - removing the attribute now resolves to
    // `false`, which equals the untouched instance default. That used to
    // make this write look like a no-op and get dropped, letting the
    // earlier queued write win instead.
    el.removeAttribute('is-readonly');

    await el.componentOnReady();

    expect(el.isReadonly).toBe(false);
    expect(el.hasAttribute('is-readonly')).toBe(false);
  });
});
