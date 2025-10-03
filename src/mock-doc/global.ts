import { MockCSSStyleSheet } from './css-style-sheet';
import { MockDocumentFragment } from './document-fragment';
import {
  MockAnchorElement,
  MockBaseElement,
  MockButtonElement,
  MockCanvasElement,
  MockFormElement,
  MockImageElement,
  MockInputElement,
  MockLinkElement,
  MockMetaElement,
  MockScriptElement,
  MockStyleElement,
  MockTemplateElement,
  MockTitleElement,
  MockUListElement,
} from './element';
import { MockCustomEvent, MockEvent, MockFocusEvent, MockKeyboardEvent, MockMouseEvent } from './event';
import { MockHeaders } from './headers';
import { MockDOMParser } from './parser';
import { MockRequest, MockResponse } from './request-response';
import { MockWindow } from './window';

export function setupGlobal(gbl: any) {
  if (gbl.window == null) {
    const win: any = (gbl.window = new MockWindow());

    WINDOW_FUNCTIONS.forEach((fnName) => {
      if (!(fnName in gbl)) {
        gbl[fnName] = win[fnName].bind(win);
      }
    });

    WINDOW_PROPS.forEach((propName) => {
      if (!(propName in gbl)) {
        Object.defineProperty(gbl, propName, {
          get() {
            return win[propName];
          },
          set(val: any) {
            win[propName] = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    });

    GLOBAL_CONSTRUCTORS.forEach(([cstrName]) => {
      gbl[cstrName] = win[cstrName];
    });
  }

  return gbl.window;
}

export function teardownGlobal(gbl: any) {
  const win = gbl.window as Window;
  if (win && typeof win.close === 'function') {
    win.close();
  }
}

export function patchWindow(winToBePatched: any) {
  const mockWin: any = new MockWindow(false);

  WINDOW_FUNCTIONS.forEach((fnName) => {
    if (typeof winToBePatched[fnName] !== 'function') {
      winToBePatched[fnName] = mockWin[fnName].bind(mockWin);
    }
  });

  WINDOW_PROPS.forEach((propName) => {
    if (winToBePatched === undefined) {
      Object.defineProperty(winToBePatched, propName, {
        get() {
          return mockWin[propName];
        },
        set(val: any) {
          mockWin[propName] = val;
        },
        configurable: true,
        enumerable: true,
      });
    }
  });
}

export function addGlobalsToWindowPrototype(mockWinPrototype: any) {
  GLOBAL_CONSTRUCTORS.forEach(([cstrName, Cstr]) => {
    Object.defineProperty(mockWinPrototype, cstrName, {
      get() {
        return this['__' + cstrName] || Cstr;
      },
      set(cstr: any) {
        this['__' + cstrName] = cstr;
      },
      configurable: true,
      enumerable: true,
    });
  });
}

const WINDOW_FUNCTIONS = [
  'addEventListener',
  'alert',
  'blur',
  'cancelAnimationFrame',
  'cancelIdleCallback',
  'clearInterval',
  'clearTimeout',
  'close',
  'confirm',
  'dispatchEvent',
  'focus',
  'getComputedStyle',
  'matchMedia',
  'open',
  'prompt',
  'removeEventListener',
  'requestAnimationFrame',
  'requestIdleCallback',
  'URL',
];

const WINDOW_PROPS = [
  'customElements',
  'devicePixelRatio',
  'document',
  'history',
  'innerHeight',
  'innerWidth',
  'localStorage',
  'location',
  'navigator',
  'pageXOffset',
  'pageYOffset',
  'performance',
  'screenLeft',
  'screenTop',
  'screenX',
  'screenY',
  'scrollX',
  'scrollY',
  'sessionStorage',
  'CSS',
  'CustomEvent',
  'Event',
  'Element',
  'HTMLElement',
  'Node',
  'NodeList',
  'FocusEvent',
  'KeyboardEvent',
  'MouseEvent',
  'CSSStyleSheet',
];

const GLOBAL_CONSTRUCTORS: [string, any][] = [
  ['CSSStyleSheet', MockCSSStyleSheet],
  ['CustomEvent', MockCustomEvent],
  ['DocumentFragment', MockDocumentFragment],
  ['DOMParser', MockDOMParser],
  ['Event', MockEvent],
  ['FocusEvent', MockFocusEvent],
  ['Headers', MockHeaders],
  ['KeyboardEvent', MockKeyboardEvent],
  ['MouseEvent', MockMouseEvent],
  ['Request', MockRequest],
  ['Response', MockResponse],
  ['ShadowRoot', MockDocumentFragment],

  ['HTMLAnchorElement', MockAnchorElement],
  ['HTMLBaseElement', MockBaseElement],
  ['HTMLButtonElement', MockButtonElement],
  ['HTMLCanvasElement', MockCanvasElement],
  ['HTMLFormElement', MockFormElement],
  ['HTMLImageElement', MockImageElement],
  ['HTMLInputElement', MockInputElement],
  ['HTMLLinkElement', MockLinkElement],
  ['HTMLMetaElement', MockMetaElement],
  ['HTMLScriptElement', MockScriptElement],
  ['HTMLStyleElement', MockStyleElement],
  ['HTMLTemplateElement', MockTemplateElement],
  ['HTMLTitleElement', MockTitleElement],
  ['HTMLUListElement', MockUListElement],
];
