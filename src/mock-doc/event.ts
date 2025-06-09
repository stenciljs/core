import { NODE_NAMES } from './constants';
import { MockDocument } from './document';
import { MockElement } from './node';
import { MockWindow } from './window';

export class MockEvent {
  bubbles = false;
  cancelBubble = false;
  cancelable = false;
  composed = false;
  currentTarget: MockElement = null;
  defaultPrevented = false;
  srcElement: MockElement = null;
  target: MockElement = null;
  timeStamp: number;
  type: string;

  constructor(type: string, eventInitDict?: EventInit) {
    if (typeof type !== 'string') {
      throw new Error(`Event type required`);
    }
    this.type = type;
    this.timeStamp = Date.now();

    if (eventInitDict != null) {
      Object.assign(this, eventInitDict);
    }
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {
    this.cancelBubble = true;
  }

  stopImmediatePropagation() {
    this.cancelBubble = true;
  }

  /**
   * @ref https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath
   * @returns a composed path of the event
   */
  composedPath(): MockElement[] {
    const composedPath: MockElement[] = [];

    let currentElement = this.target;

    while (currentElement) {
      composedPath.push(currentElement);

      if (!currentElement.parentElement && currentElement.nodeName === NODE_NAMES.DOCUMENT_NODE) {
        // the current element doesn't have a parent, but we've detected it's our root document node. push the window
        // object associated with the document onto the path
        composedPath.push((currentElement as MockDocument).defaultView);
        break;
      }

      /**
       * bubble up the parent chain until we arrive to the HTML element. Here we continue
       * with the document object instead of the parent element since the parent element
       * is `null` for HTML elements.
       */
      if (currentElement.parentElement == null && currentElement.tagName === 'HTML') {
        currentElement = currentElement.ownerDocument;
      } else {
        currentElement = currentElement.parentElement;
      }
    }

    return composedPath;
  }
}

export class MockCustomEvent extends MockEvent {
  detail: any = null;

  constructor(type: string, customEventInitDic?: CustomEventInit) {
    super(type);

    if (customEventInitDic != null) {
      Object.assign(this, customEventInitDic);
    }
  }
}

export class MockKeyboardEvent extends MockEvent {
  code = '';
  key = '';
  altKey = false;
  ctrlKey = false;
  metaKey = false;
  shiftKey = false;
  location = 0;
  repeat = false;

  constructor(type: string, keyboardEventInitDic?: KeyboardEventInit) {
    super(type);

    if (keyboardEventInitDic != null) {
      Object.assign(this, keyboardEventInitDic);
    }
  }
}

export class MockMouseEvent extends MockEvent {
  screenX = 0;
  screenY = 0;
  clientX = 0;
  clientY = 0;
  ctrlKey = false;
  shiftKey = false;
  altKey = false;
  metaKey = false;
  button = 0;
  buttons = 0;
  relatedTarget: EventTarget = null;

  constructor(type: string, mouseEventInitDic?: MouseEventInit) {
    super(type);

    if (mouseEventInitDic != null) {
      Object.assign(this, mouseEventInitDic);
    }
  }
}

export class MockUIEvent extends MockEvent {
  detail: number | null = null;
  view: MockWindow | null = null;

  constructor(type: string, uiEventInitDic?: UIEventInit) {
    super(type);

    if (uiEventInitDic != null) {
      Object.assign(this, uiEventInitDic);
    }
  }
}

export class MockFocusEvent extends MockUIEvent {
  relatedTarget: EventTarget | null = null;

  constructor(type: 'blur' | 'focus', focusEventInitDic?: FocusEventInit) {
    super(type);

    if (focusEventInitDic != null) {
      Object.assign(this, focusEventInitDic);
    }
  }
}

export class MockEventListener {
  type: string;
  handler: (ev?: any) => void;

  constructor(type: string, handler: any) {
    this.type = type;
    this.handler = handler;
  }
}

export function addEventListener(elm: any, type: string, handler: any) {
  const target: EventTarget = elm;

  if (target.__listeners == null) {
    target.__listeners = [];
  }

  target.__listeners.push(new MockEventListener(type, handler));
}

export function removeEventListener(elm: any, type: string, handler: any) {
  const target: EventTarget = elm;

  if (target != null && Array.isArray(target.__listeners) === true) {
    const elmListener = target.__listeners.find((e) => e.type === type && e.handler === handler);
    if (elmListener != null) {
      const index = target.__listeners.indexOf(elmListener);
      target.__listeners.splice(index, 1);
    }
  }
}

export function resetEventListeners(target: any) {
  if (target != null && (target as EventTarget).__listeners != null) {
    (target as EventTarget).__listeners = null;
  }
}

function triggerEventListener(elm: any, ev: MockEvent) {
  if (elm == null || ev.cancelBubble === true) {
    return;
  }

  const target: EventTarget = elm;
  ev.currentTarget = elm;

  if (Array.isArray(target.__listeners) === true) {
    const listeners = target.__listeners.filter((e) => e.type === ev.type);
    listeners.forEach((listener) => {
      try {
        listener.handler.call(target, ev);
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (ev.bubbles === false) {
    return;
  }

  if (elm.nodeName === NODE_NAMES.DOCUMENT_NODE) {
    triggerEventListener((elm as MockDocument).defaultView, ev);
  } else if (elm.parentElement == null && elm.tagName === 'HTML') {
    triggerEventListener(elm.ownerDocument, ev);
  } else {
    triggerEventListener(elm.parentElement, ev);
  }
}

export function dispatchEvent(currentTarget: any, ev: MockEvent) {
  ev.target = currentTarget;
  triggerEventListener(currentTarget, ev);
  return true;
}

export interface EventTarget {
  __listeners: MockEventListener[];
}
