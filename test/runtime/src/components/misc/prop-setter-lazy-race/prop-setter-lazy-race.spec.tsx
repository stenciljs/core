import { describe, expect, it } from 'vitest';

describe('getter/setter @Prop write ordering before first render', () => {
  it('the last write before first render wins, same as a plain @Prop', async () => {
    // Render a first instance so its module is loaded and cached
    const warmup = document.createElement('prop-setter-lazy-race');
    document.body.appendChild(warmup);
    await (warmup as any).componentOnReady();

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

    warmup.remove();
    el.remove();
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

  it('the last attribute write wins when it lands before the lazy instance exists', async () => {
    // not connected yet
    const detached = document.createElement('prop-setter-lazy-race-cold') as any;
    detached.setAttribute('is-disabled', '');
    detached.removeAttribute('is-disabled');
    document.body.appendChild(detached);

    // connected, but the component's chunk is still loading
    const loading = document.createElement('prop-setter-lazy-race-cold') as any;
    document.body.appendChild(loading);
    loading.setAttribute('is-disabled', '');
    loading.removeAttribute('is-disabled');

    // reads before the instance exists return the pending value, same as a plain @Prop
    loading.note = 'pending';
    expect(loading.note).toBe('pending');

    // standalone's autoloader only defines a tag once it's seen in the DOM
    await customElements.whenDefined('prop-setter-lazy-race-cold');
    await Promise.all([detached.componentOnReady(), loading.componentOnReady()]);

    expect(detached.isDisabled).toBe(false);
    expect(loading.isDisabled).toBe(false);
    expect(loading.note).toBe('pending');
  });

  it('an attribute write equal to the current instance value is not dropped before first render', async () => {
    const warmup = document.createElement('prop-setter-lazy-race');
    document.body.appendChild(warmup);
    await warmup.componentOnReady();

    const el = document.createElement('prop-setter-lazy-race') as any;
    el.count = 5;
    document.body.appendChild(el);

    // `0` is the instance's constructor default; it must still override the earlier `5`
    el.setAttribute('count', '0');

    await el.componentOnReady();

    expect(el.count).toBe(0);
  });

  it("the instance's connectedCallback sees writes made before it was constructed", async () => {
    const warmup = document.createElement('prop-setter-lazy-race');
    document.body.appendChild(warmup);
    await warmup.componentOnReady();

    const el = document.createElement('prop-setter-lazy-race') as any;
    el.isReadonly = true;
    el.count = 3;
    document.body.appendChild(el);

    await el.componentOnReady();

    expect(el.connectedSnapshot).toBe('true-3');
  });
});
