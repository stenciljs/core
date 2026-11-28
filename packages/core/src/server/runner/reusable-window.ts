import { MockWindow, resetWindowForReuse } from '@stencil/mock-doc';

/**
 * A canonical key for a `serializeShadowRoot` value: values that render every component the same
 * way get the same key.
 *
 * Rendering shadow components as scoped permanently changes their metadata inside the SSR platform
 * that rendered them, so a platform (and a reusable window) can only be shared by renders whose
 * `serializeShadowRoot` marks the same components as scoped. Which components that is depends
 * only on this value: for the object form, on `default` and the two tag lists - so those are
 * normalized (lowercased, de-duplicated, sorted) to give equivalent objects one key.
 * @param serializeShadowRoot the render's `serializeShadowRoot` option
 * @returns the key
 */
export function serializeShadowRootKey(serializeShadowRoot: unknown): string {
  if (serializeShadowRoot === null || typeof serializeShadowRoot !== 'object') {
    return `${typeof serializeShadowRoot}:${serializeShadowRoot}`;
  }
  const opts = serializeShadowRoot as Record<string, unknown>;
  const tags = (list: unknown) =>
    Array.isArray(list)
      ? [...new Set(list.map((tag) => String(tag).toLowerCase()))].sort().join(',')
      : '';
  return `object:default=${opts.default};dsd=${tags(opts['declarative-shadow-dom'])};scoped=${tags(opts.scoped)}`;
}

/** The most reusable windows kept at once (one per distinct `serializeShadowRoot` key). */
const MAX_REUSABLE_WINDOWS = 16;

/** Long-lived windows used by `reuseWindow` renders, by `serializeShadowRoot` key. */
const reusableWindows = new Map<string, MockWindow>();

/** Renders sharing a reusable window must not overlap, so each key has a queue. */
const renderQueues = new Map<string, Promise<unknown>>();

const NOOP = () => {};

/**
 * Run `render` once every earlier render using the same reusable window has finished.
 * @param key the render's {@link serializeShadowRootKey}
 * @param render the render to run
 * @returns the render's result
 */
export function enqueueReusableRender<T>(key: string, render: () => Promise<T>): Promise<T> {
  const queued = (renderQueues.get(key) ?? Promise.resolve()).then(render, render);
  renderQueues.set(key, queued.then(NOOP, NOOP));
  return queued;
}

/**
 * Get the reusable window for a `serializeShadowRoot` key, reset and holding `html`.
 * @param html the HTML to render
 * @param key the render's {@link serializeShadowRootKey}
 * @returns the window to render into
 */
export function getReusableWindow(html: string, key: string): MockWindow {
  let win = reusableWindows.get(key);
  if (!win) {
    if (reusableWindows.size >= MAX_REUSABLE_WINDOWS) {
      // Forget the oldest. Not closed: a render may still be using it, and it's garbage
      // collected once that render is done.
      reusableWindows.delete(reusableWindows.keys().next().value!);
    }
    win = new MockWindow(html);
    reusableWindows.set(key, win);
    return win;
  }

  try {
    resetWindowForReuse(win, html);
    return win;
  } catch (e) {
    discardReusableWindow(key);
    throw e;
  }
}

/**
 * Stop reusing the window for a key, e.g. after a render failed and may have left it in a bad
 * state. The next render with that key creates a new one.
 * @param key the render's {@link serializeShadowRootKey}
 */
export function discardReusableWindow(key: string) {
  const win = reusableWindows.get(key);
  reusableWindows.delete(key);
  try {
    win?.close();
  } catch {}
}

/**
 * Drop every reusable window and render queue. For hosts where a render can be abandoned without
 * ever settling (the `ssr-wasm` plugin, when a call ends with a render still waiting), so the
 * next render doesn't queue behind it forever.
 */
export function resetReusableWindows() {
  for (const win of reusableWindows.values()) {
    try {
      win.close();
    } catch {}
  }
  reusableWindows.clear();
  renderQueues.clear();
}
