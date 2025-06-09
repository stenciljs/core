import { MockHeaders } from '.';
import { createConsole } from './console';
import { MockCustomElementRegistry } from './custom-element-registry';
import { MockDocument, resetDocument } from './document';
import { MockDocumentFragment } from './document-fragment';
import {
  addEventListener,
  dispatchEvent,
  MockCustomEvent,
  MockEvent,
  MockFocusEvent,
  MockKeyboardEvent,
  MockMouseEvent,
  removeEventListener,
  resetEventListeners,
} from './event';
import { addGlobalsToWindowPrototype } from './global';
import { MockHistory } from './history';
import { MockIntersectionObserver } from './intersection-observer';
import { MockLocation } from './location';
import { MockNavigator } from './navigator';
import { MockElement, MockHTMLElement, MockNode, MockNodeList } from './node';
import { MockPerformance, resetPerformance } from './performance';
import { MockResizeObserver } from './resize-observer';
import { MockShadowRoot } from './shadow-root';
import { MockStorage } from './storage';

const nativeClearInterval = globalThis.clearInterval;
const nativeClearTimeout = globalThis.clearTimeout;
const nativeSetInterval = globalThis.setInterval;
const nativeSetTimeout = globalThis.setTimeout;
const nativeURL = globalThis.URL;
const nativeWindow = globalThis.window;

export class MockWindow {
  __timeouts: Set<any>;
  __history: MockHistory;
  __elementCstr: any;
  __htmlElementCstr: any;
  __charDataCstr: any;
  __docTypeCstr: any;
  __docCstr: any;
  __docFragCstr: any;
  __domTokenListCstr: any;
  __nodeCstr: any;
  __nodeListCstr: any;
  __localStorage: MockStorage;
  __sessionStorage: MockStorage;
  __location: MockLocation;
  __navigator: MockNavigator;
  __clearInterval: typeof nativeClearInterval;
  __clearTimeout: typeof nativeClearTimeout;
  __setInterval: typeof nativeSetInterval;
  __setTimeout: typeof nativeSetTimeout;
  __maxTimeout: number;
  __allowInterval: boolean;
  URL: typeof URL;

  console: Console;
  customElements: CustomElementRegistry;
  document: Document;
  performance: Performance;

  devicePixelRatio: number;
  innerHeight: number;
  innerWidth: number;
  pageXOffset: number;
  pageYOffset: number;
  screen: Screen;
  screenLeft: number;
  screenTop: number;
  screenX: number;
  screenY: number;
  scrollX: number;
  scrollY: number;

  // event handlers
  CustomEvent: typeof MockCustomEvent;
  Event: typeof MockEvent;
  Headers: typeof MockHeaders;
  FocusEvent: typeof MockFocusEvent;
  KeyboardEvent: typeof MockKeyboardEvent;
  MouseEvent: typeof MockMouseEvent;

  constructor(html: string | boolean = null) {
    if (html !== false) {
      this.document = new MockDocument(html, this) as any;
    } else {
      this.document = null;
    }
    this.performance = new MockPerformance();
    this.customElements = new MockCustomElementRegistry(this as any);
    this.console = createConsole();
    resetWindowDefaults(this);
    resetWindowDimensions(this);
  }

  addEventListener(type: string, handler: (ev?: any) => void) {
    addEventListener(this, type, handler);
  }

  alert(msg: string) {
    if (this.console) {
      this.console.debug(msg);
    } else {
      console.debug(msg);
    }
  }

  blur(): any {
    /**/
  }

  cancelAnimationFrame(id: any) {
    this.__clearTimeout.call(nativeWindow || this, id);
  }

  cancelIdleCallback(id: any) {
    this.__clearTimeout.call(nativeWindow || this, id);
  }

  get CharacterData() {
    if (this.__charDataCstr == null) {
      const ownerDocument = this.document;
      this.__charDataCstr = class extends MockNode {
        constructor() {
          super(ownerDocument, 0, 'test', '');
          throw new Error('Illegal constructor: cannot construct CharacterData');
        }
      };
    }
    return this.__charDataCstr;
  }
  set CharacterData(charDataCstr: any) {
    this.__charDataCstr = charDataCstr;
  }

  clearInterval(id: any) {
    this.__clearInterval.call(nativeWindow || this, id);
  }

  clearTimeout(id: any) {
    this.__clearTimeout.call(nativeWindow || this, id);
  }

  close() {
    resetWindow(this as any);
  }

  confirm() {
    return false;
  }

  get CSS() {
    return {
      supports: () => true,
    };
  }

  get Document() {
    if (this.__docCstr == null) {
      const win = this;
      this.__docCstr = class extends MockDocument {
        constructor() {
          super(false, win);
          throw new Error('Illegal constructor: cannot construct Document');
        }
      };
    }
    return this.__docCstr;
  }
  set Document(docCstr: any) {
    this.__docCstr = docCstr;
  }

  get DocumentFragment() {
    if (this.__docFragCstr == null) {
      const ownerDocument = this.document;
      this.__docFragCstr = class extends MockDocumentFragment {
        constructor() {
          super(ownerDocument);
          throw new Error('Illegal constructor: cannot construct DocumentFragment');
        }
      };
    }
    return this.__docFragCstr;
  }
  set DocumentFragment(docFragCstr: any) {
    this.__docFragCstr = docFragCstr;
  }

  get ShadowRoot() {
    return MockShadowRoot;
  }

  get DocumentType() {
    if (this.__docTypeCstr == null) {
      const ownerDocument = this.document;
      this.__docTypeCstr = class extends MockNode {
        constructor() {
          super(ownerDocument, 0, 'test', '');
          throw new Error('Illegal constructor: cannot construct DocumentType');
        }
      };
    }
    return this.__docTypeCstr;
  }
  set DocumentType(docTypeCstr: any) {
    this.__docTypeCstr = docTypeCstr;
  }

  get DOMTokenList() {
    if (this.__domTokenListCstr == null) {
      this.__domTokenListCstr = class MockDOMTokenList {};
    }
    return this.__domTokenListCstr;
  }
  set DOMTokenList(domTokenListCstr: any) {
    this.__domTokenListCstr = domTokenListCstr;
  }

  dispatchEvent(ev: MockEvent) {
    return dispatchEvent(this, ev);
  }

  get Element() {
    if (this.__elementCstr == null) {
      const ownerDocument = this.document;
      this.__elementCstr = class extends MockElement {
        constructor() {
          super(ownerDocument, '');
          throw new Error('Illegal constructor: cannot construct Element');
        }
      };
    }
    return this.__elementCstr;
  }

  fetch(input: any, init?: any): any {
    if (typeof fetch === 'function') {
      return fetch(input, init);
    }
    throw new Error(`fetch() not implemented`);
  }

  focus(): any {
    /**/
  }

  getComputedStyle(_: any) {
    return {
      cssText: '',
      length: 0,
      parentRule: null,
      getPropertyPriority(): any {
        return null;
      },
      getPropertyValue(): any {
        return '';
      },
      item(): any {
        return null;
      },
      removeProperty(): any {
        return null;
      },
      setProperty(): any {
        return null;
      },
    } as any;
  }

  get globalThis() {
    return this;
  }

  get history() {
    if (this.__history == null) {
      this.__history = new MockHistory();
    }
    return this.__history;
  }
  set history(hsty: any) {
    this.__history = hsty;
  }

  get JSON() {
    return JSON;
  }

  get HTMLElement() {
    if (this.__htmlElementCstr == null) {
      const ownerDocument = this.document;
      this.__htmlElementCstr = class extends MockHTMLElement {
        constructor() {
          super(ownerDocument, '');

          const observedAttributes = (this.constructor as any).observedAttributes;
          if (Array.isArray(observedAttributes) && typeof (this as any).attributeChangedCallback === 'function') {
            observedAttributes.forEach((attrName) => {
              const attrValue = this.getAttribute(attrName);
              if (attrValue != null) {
                (this as any).attributeChangedCallback(attrName, null, attrValue);
              }
            });
          }
        }
      };
    }
    return this.__htmlElementCstr;
  }
  set HTMLElement(htmlElementCstr: any) {
    this.__htmlElementCstr = htmlElementCstr;
  }

  get IntersectionObserver() {
    return MockIntersectionObserver;
  }

  get ResizeObserver() {
    return MockResizeObserver;
  }

  get localStorage() {
    if (this.__localStorage == null) {
      this.__localStorage = new MockStorage();
    }
    return this.__localStorage;
  }
  set localStorage(locStorage: MockStorage) {
    this.__localStorage = locStorage;
  }

  get location(): MockLocation {
    if (this.__location == null) {
      this.__location = new MockLocation();
    }
    return this.__location;
  }
  set location(val: Location | string) {
    if (typeof val === 'string') {
      if (this.__location == null) {
        this.__location = new MockLocation();
      }
      this.__location.href = val;
    } else {
      this.__location = val as any;
    }
  }

  matchMedia(media: string) {
    return {
      media,
      matches: false,
      addListener: (_handler: (ev?: any) => void) => {},
      removeListener: (_handler: (ev?: any) => void) => {},
      addEventListener: (_type: string, _handler: (ev?: any) => void) => {},
      removeEventListener: (_type: string, _handler: (ev?: any) => void) => {},
      dispatchEvent: (_ev: any) => {},
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null,
    };
  }

  get Node() {
    if (this.__nodeCstr == null) {
      const ownerDocument = this.document;
      this.__nodeCstr = class extends MockNode {
        constructor() {
          super(ownerDocument, 0, 'test', '');
          throw new Error('Illegal constructor: cannot construct Node');
        }
      };
    }
    return this.__nodeCstr;
  }

  get NodeList() {
    if (this.__nodeListCstr == null) {
      const ownerDocument = this.document;
      this.__nodeListCstr = class extends MockNodeList {
        constructor() {
          super(ownerDocument, [], 0);
          throw new Error('Illegal constructor: cannot construct NodeList');
        }
      };
    }
    return this.__nodeListCstr;
  }

  get navigator() {
    if (this.__navigator == null) {
      this.__navigator = new MockNavigator();
    }
    return this.__navigator;
  }
  set navigator(nav: any) {
    this.__navigator = nav;
  }

  get parent(): any {
    return null;
  }

  prompt() {
    return '';
  }

  open(): any {
    return null;
  }

  get origin() {
    return this.location.origin;
  }

  removeEventListener(type: string, handler: any) {
    removeEventListener(this, type, handler);
  }

  requestAnimationFrame(callback: (timestamp: number) => void) {
    return this.setTimeout(() => {
      callback(Date.now());
    }, 0) as number;
  }

  requestIdleCallback(callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) {
    return this.setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      });
    }, 0);
  }

  scroll(_x?: number, _y?: number) {
    /**/
  }

  scrollBy(_x?: number, _y?: number) {
    /**/
  }

  scrollTo(_x?: number, _y?: number) {
    /**/
  }

  get self() {
    return this;
  }

  get sessionStorage() {
    if (this.__sessionStorage == null) {
      this.__sessionStorage = new MockStorage();
    }
    return this.__sessionStorage;
  }
  set sessionStorage(locStorage: any) {
    this.__sessionStorage = locStorage;
  }

  setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): number {
    if (this.__timeouts == null) {
      this.__timeouts = new Set();
    }

    ms = Math.min(ms, this.__maxTimeout);

    if (this.__allowInterval) {
      const intervalId = this.__setInterval(() => {
        if (this.__timeouts) {
          this.__timeouts.delete(intervalId);

          try {
            callback(...args);
          } catch (e) {
            if (this.console) {
              this.console.error(e);
            } else {
              console.error(e);
            }
          }
        }
      }, ms) as any;

      if (this.__timeouts) {
        this.__timeouts.add(intervalId);
      }

      return intervalId;
    }

    const timeoutId = this.__setTimeout.call(
      nativeWindow || this,
      () => {
        if (this.__timeouts) {
          this.__timeouts.delete(timeoutId);

          try {
            callback(...args);
          } catch (e) {
            if (this.console) {
              this.console.error(e);
            } else {
              console.error(e);
            }
          }
        }
      },
      ms,
    ) as any;

    if (this.__timeouts) {
      this.__timeouts.add(timeoutId);
    }

    return timeoutId;
  }

  setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number {
    if (this.__timeouts == null) {
      this.__timeouts = new Set();
    }

    ms = Math.min(ms, this.__maxTimeout);

    const timeoutId = this.__setTimeout.call(
      nativeWindow || this,
      () => {
        if (this.__timeouts) {
          this.__timeouts.delete(timeoutId);

          try {
            callback(...args);
          } catch (e) {
            if (this.console) {
              this.console.error(e);
            } else {
              console.error(e);
            }
          }
        }
      },
      ms,
    ) as any as number;

    if (this.__timeouts) {
      this.__timeouts.add(timeoutId);
    }

    return timeoutId;
  }

  get top() {
    return this;
  }

  get window() {
    return this;
  }

  onanimationstart() {
    /**/
  }
  onanimationend() {
    /**/
  }
  onanimationiteration() {
    /**/
  }
  onabort() {
    /**/
  }
  onauxclick() {
    /**/
  }
  onbeforecopy() {
    /**/
  }
  onbeforecut() {
    /**/
  }
  onbeforepaste() {
    /**/
  }
  onblur() {
    /**/
  }
  oncancel() {
    /**/
  }
  oncanplay() {
    /**/
  }
  oncanplaythrough() {
    /**/
  }
  onchange() {
    /**/
  }
  onclick() {
    /**/
  }
  onclose() {
    /**/
  }
  oncontextmenu() {
    /**/
  }
  oncopy() {
    /**/
  }
  oncuechange() {
    /**/
  }
  oncut() {
    /**/
  }
  ondblclick() {
    /**/
  }
  ondrag() {
    /**/
  }
  ondragend() {
    /**/
  }
  ondragenter() {
    /**/
  }
  ondragleave() {
    /**/
  }
  ondragover() {
    /**/
  }
  ondragstart() {
    /**/
  }
  ondrop() {
    /**/
  }
  ondurationchange() {
    /**/
  }
  onemptied() {
    /**/
  }
  onended() {
    /**/
  }
  onerror() {
    /**/
  }
  onfocus() {
    /**/
  }
  onfocusin() {
    /**/
  }
  onfocusout() {
    /**/
  }
  onformdata() {
    /**/
  }
  onfullscreenchange() {
    /**/
  }
  onfullscreenerror() {
    /**/
  }
  ongotpointercapture() {
    /**/
  }
  oninput() {
    /**/
  }
  oninvalid() {
    /**/
  }
  onkeydown() {
    /**/
  }
  onkeypress() {
    /**/
  }
  onkeyup() {
    /**/
  }
  onload() {
    /**/
  }
  onloadeddata() {
    /**/
  }
  onloadedmetadata() {
    /**/
  }
  onloadstart() {
    /**/
  }
  onlostpointercapture() {
    /**/
  }
  onmousedown() {
    /**/
  }
  onmouseenter() {
    /**/
  }
  onmouseleave() {
    /**/
  }
  onmousemove() {
    /**/
  }
  onmouseout() {
    /**/
  }
  onmouseover() {
    /**/
  }
  onmouseup() {
    /**/
  }
  onmousewheel() {
    /**/
  }
  onpaste() {
    /**/
  }
  onpause() {
    /**/
  }
  onplay() {
    /**/
  }
  onplaying() {
    /**/
  }
  onpointercancel() {
    /**/
  }
  onpointerdown() {
    /**/
  }
  onpointerenter() {
    /**/
  }
  onpointerleave() {
    /**/
  }
  onpointermove() {
    /**/
  }
  onpointerout() {
    /**/
  }
  onpointerover() {
    /**/
  }
  onpointerup() {
    /**/
  }
  onprogress() {
    /**/
  }
  onratechange() {
    /**/
  }
  onreset() {
    /**/
  }
  onresize() {
    /**/
  }
  onscroll() {
    /**/
  }
  onsearch() {
    /**/
  }
  onseeked() {
    /**/
  }
  onseeking() {
    /**/
  }
  onselect() {
    /**/
  }
  onselectstart() {
    /**/
  }
  onstalled() {
    /**/
  }
  onsubmit() {
    /**/
  }
  onsuspend() {
    /**/
  }
  ontimeupdate() {
    /**/
  }
  ontoggle() {
    /**/
  }
  onvolumechange() {
    /**/
  }
  onwaiting() {
    /**/
  }
  onwebkitfullscreenchange() {
    /**/
  }
  onwebkitfullscreenerror() {
    /**/
  }
  onwheel() {
    /**/
  }
}

addGlobalsToWindowPrototype(MockWindow.prototype);

function resetWindowDefaults(win: MockWindow) {
  win.__clearInterval = nativeClearInterval;
  win.__clearTimeout = nativeClearTimeout;
  win.__setInterval = nativeSetInterval;
  win.__setTimeout = nativeSetTimeout;
  win.__maxTimeout = 60000;
  win.__allowInterval = true;
  win.URL = nativeURL;
}

export function createWindow(html: string | boolean = null): Window {
  return new MockWindow(html) as any;
}

export function cloneWindow(srcWin: Window, opts: { customElementProxy?: boolean } = {}): MockWindow | null {
  if (srcWin == null) {
    return null;
  }

  const clonedWin = new MockWindow(false);
  if (!opts.customElementProxy) {
    // TODO(STENCIL-345) - Evaluate reconciling MockWindow, Window differences
    // @ts-ignore
    srcWin.customElements = null;
  }

  if (srcWin.document != null) {
    const clonedDoc = new MockDocument(false, clonedWin);
    clonedWin.document = clonedDoc as any;
    clonedDoc.documentElement = srcWin.document.documentElement.cloneNode(true) as any;
  } else {
    clonedWin.document = new MockDocument(null, clonedWin) as any;
  }
  return clonedWin;
}

export function cloneDocument(srcDoc: Document) {
  if (srcDoc == null || !srcDoc.defaultView) {
    return null;
  }

  const dstWin = cloneWindow(srcDoc.defaultView);
  return dstWin?.document || null;
}

// TODO(STENCIL-345) - Evaluate reconciling MockWindow, Window differences
/**
 * Constrain setTimeout() to 1ms, but still async. Also
 * only allow setInterval() to fire once, also constrained to 1ms.
 * @param win the mock window instance to update
 */
export function constrainTimeouts(win: any) {
  (win as MockWindow).__allowInterval = false;
  (win as MockWindow).__maxTimeout = 0;
}

function resetWindow(win: MockWindow) {
  if (win != null) {
    if (win.__timeouts) {
      win.__timeouts.forEach((timeoutId) => {
        nativeClearInterval(timeoutId);
        nativeClearTimeout(timeoutId);
      });
      win.__timeouts.clear();
    }
    if (win.customElements && (win.customElements as MockCustomElementRegistry).clear) {
      (win.customElements as MockCustomElementRegistry).clear();
    }

    resetDocument(win.document);
    resetPerformance(win.performance);

    for (const key in win) {
      if (win.hasOwnProperty(key) && key !== 'document' && key !== 'performance' && key !== 'customElements') {
        delete (win as any)[key];
      }
    }
    resetWindowDefaults(win);
    resetWindowDimensions(win);
    resetEventListeners(win);

    if (win.document != null) {
      try {
        (win.document as any).defaultView = win;
      } catch (e) {}
    }

    // ensure we don't hold onto nodeFetch values
    (win as any).fetch = null;
    (win as any).Headers = null;
    (win as any).Request = null;
    (win as any).Response = null;
    (win as any).FetchError = null;
  }
}

function resetWindowDimensions(win: MockWindow) {
  try {
    win.devicePixelRatio = 1;

    win.innerHeight = 768;
    win.innerWidth = 1366;

    win.pageXOffset = 0;
    win.pageYOffset = 0;

    win.screenLeft = 0;
    win.screenTop = 0;
    win.screenX = 0;
    win.screenY = 0;
    win.scrollX = 0;
    win.scrollY = 0;

    win.screen = {
      availHeight: win.innerHeight,
      availLeft: 0,
      availTop: 0,
      availWidth: win.innerWidth,
      colorDepth: 24,
      height: win.innerHeight,
      keepAwake: false,
      orientation: {
        angle: 0,
        type: 'portrait-primary',
      } as any,
      pixelDepth: 24,
      width: win.innerWidth,
    } as any;
  } catch (e) {}
}
