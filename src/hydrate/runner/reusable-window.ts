import { MockWindow } from '@stencil/core/mock-doc';

import { resetWindowForReuse } from '../../mock-doc/window';

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

  try {
    resetWindowForReuse(win, doc);
    return win;
  } catch (e) {
    reusableWindows.delete(modeKey);
    win.close();
    throw e;
  }
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
