import { MockWindow, parseHtmlToDocument, resetDocument } from '@stencil/core/mock-doc';

import { resetEventListeners } from '../../mock-doc/event';

/**
 * Process-global windows reused across renders when `reuseWindow` is enabled,
 * one per built-in `serializeShadowRoot` mode. Scoped serialization permanently
 * updates component metadata inside the cached hydrate platform.
 */
const reusableWindows = new Map<string, MockWindow>();
const windowDefaults = new MockWindow(false);
const documentKeyKeepers = new Set([
  '_nodeValue',
  'nodeName',
  'nodeType',
  'ownerDocument',
  'parentNode',
  '_childNodes',
  '__namespaceURI',
  'defaultView',
  'cookie',
  'referrer',
]);
const windowKeyKeepers = new Set([
  'document',
  'performance',
  'console',
  '__history',
  '__localStorage',
  '__location',
  '__navigator',
  '__sessionStorage',
  'screen',
]);

export function getReusableWindow(doc: string, serializeShadowRoot: unknown): MockWindow {
  const modeKey = getModeKey(serializeShadowRoot);
  let win = reusableWindows.get(modeKey);
  if (!win) {
    win = new MockWindow(doc);
    reusableWindows.set(modeKey, win);
    return win;
  }

  try {
    const document = win.document;
    resetReusableWindow(win);
    resetDocument(document);
    deleteUnknownKeys(document, documentKeyKeepers);
    (document as any).defaultView = win;
    resetObject(win.location, windowDefaults.location);
    resetObject(win.navigator, windowDefaults.navigator);
    win.localStorage.clear();
    win.sessionStorage.clear();

    /**
     * Use fresh elements because the runtime's `rootAppliedStyles` WeakMap is
     * keyed on the head node. Reusing its identity would drop scoped styles.
     */
    const parsedDocument = parseHtmlToDocument(doc, document as any);
    (document as any).documentElement = parsedDocument.documentElement;

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
  resetObject(win.console, windowDefaults.console);
  resetObject(win.history, windowDefaults.history);
  const screenOrientation = win.screen.orientation;
  resetObject(screenOrientation, windowDefaults.screen.orientation);
  resetObject(win.screen, {
    ...windowDefaults.screen,
    orientation: screenOrientation,
  });
  const eventCounts = win.performance.eventCounts as Map<string, number>;
  eventCounts.clear();
  resetObject(eventCounts, {});
  resetObject(win.performance as any, {
    timeOrigin: Date.now(),
    eventCounts,
  });
  deleteUnknownKeys(win, windowKeyKeepers);

  win.__clearInterval = windowDefaults.__clearInterval;
  win.__clearTimeout = windowDefaults.__clearTimeout;
  win.__setInterval = windowDefaults.__setInterval;
  win.__setTimeout = windowDefaults.__setTimeout;
  win.__allowInterval = windowDefaults.__allowInterval;
  win.__maxTimeout = windowDefaults.__maxTimeout;
  win.URL = windowDefaults.URL;
  win.devicePixelRatio = windowDefaults.devicePixelRatio;
  win.innerHeight = windowDefaults.innerHeight;
  win.innerWidth = windowDefaults.innerWidth;
  win.pageXOffset = windowDefaults.pageXOffset;
  win.pageYOffset = windowDefaults.pageYOffset;
  win.screenLeft = windowDefaults.screenLeft;
  win.screenTop = windowDefaults.screenTop;
  win.screenX = windowDefaults.screenX;
  win.screenY = windowDefaults.screenY;
  win.scrollX = windowDefaults.scrollX;
  win.scrollY = windowDefaults.scrollY;
}

function resetObject(target: object, defaults: object) {
  for (const key of Reflect.ownKeys(target)) {
    delete (target as any)[key];
  }
  Object.assign(target, defaults);
}

function deleteUnknownKeys(target: object, keyKeepers: Set<string>) {
  for (const key of Reflect.ownKeys(target)) {
    if (typeof key !== 'string' || !keyKeepers.has(key)) {
      delete (target as any)[key];
    }
  }
}
