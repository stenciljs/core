import { MockWindow } from '@stencil/core/mock-doc';

import { resetEventListeners } from '../../mock-doc/event';

/**
 * Process-global windows reused across renders when `reuseWindow` is enabled,
 * one per built-in `serializeShadowRoot` mode. Scoped serialization permanently
 * updates component metadata inside the cached hydrate platform.
 */
const reusableWindows = new Map<string, MockWindow>();

export function getReusableWindow(doc: string, serializeShadowRoot: unknown): MockWindow {
  const modeKey = getModeKey(serializeShadowRoot);
  let win = reusableWindows.get(modeKey);
  if (!win) {
    win = new MockWindow(doc);
    reusableWindows.set(modeKey, win);
    return win;
  }

  const document = win.document;
  resetReusableWindow(win);
  const defaults = new MockWindow(false);
  resetObject(win.location, defaults.location);
  resetObject(win.navigator, defaults.navigator);
  win.localStorage.clear();
  win.sessionStorage.clear();
  document.cookie = '';
  (document as any).referrer = '';
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('data-stencil-build');
  document.documentElement.removeAttribute('class');

  /**
   * Use fresh elements because the runtime's `rootAppliedStyles` WeakMap is
   * keyed on the head node. Reusing its identity would drop scoped styles.
   */
  const newHead = document.createElement('head');
  document.documentElement.replaceChild(newHead, document.head);
  const newBody = document.createElement('body');
  newBody.innerHTML = doc;
  document.documentElement.replaceChild(newBody, document.body);

  return win;
}

export function deleteReusableWindow(serializeShadowRoot: unknown) {
  reusableWindows.delete(getModeKey(serializeShadowRoot));
}

export function canReuseWindow(serializeShadowRoot: unknown): boolean {
  return (
    typeof serializeShadowRoot === 'boolean' ||
    serializeShadowRoot === 'scoped' ||
    serializeShadowRoot === 'declarative-shadow-dom'
  );
}

function getModeKey(serializeShadowRoot: unknown): string {
  if (canReuseWindow(serializeShadowRoot)) {
    return `${typeof serializeShadowRoot}:${serializeShadowRoot}`;
  }
  throw new Error('A reusable window requires a built-in serializeShadowRoot value.');
}

function resetReusableWindow(win: MockWindow) {
  if (win.__timeouts) {
    win.__timeouts.forEach((timeoutId) => {
      win.clearInterval(timeoutId);
      win.clearTimeout(timeoutId);
    });
    win.__timeouts.clear();
  }
  win.__allowInterval = true;
  win.__maxTimeout = 60000;
  resetEventListeners(win);
  resetEventListeners(win.document);
}

function resetObject(target: object, defaults: object) {
  for (const key of Object.keys(target)) {
    delete (target as any)[key];
  }
  Object.assign(target, defaults);
}
