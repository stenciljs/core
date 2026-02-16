import { MockDocument } from '../document';
import { MockEvent } from '../event';
import { MockElement } from '../node';
import { MockWindow } from '../window';

describe('event', () => {
  let win: MockWindow;
  beforeEach(() => {
    win = new MockWindow();
  });

  it('Event() requires type', () => {
    expect(() => {
      // @ts-ignore checking that it throws when not supplied required args
      new win.Event();
    }).toThrow();
  });

  it('Event(type)', () => {
    const ev = new win.Event('click');
    expect(ev.bubbles).toBe(false);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(false);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('click');
  });

  it('Event(type, eventInitDict)', () => {
    const eventInitDict = {
      bubbles: true,
      composed: true,
    };
    const ev = new win.Event('click', eventInitDict);
    expect(ev.bubbles).toBe(true);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(true);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('click');
  });

  it('CustomEvent() requires type', () => {
    expect(() => {
      // @ts-ignore checking that it throws when not supplied required args
      new win.CustomEvent();
    }).toThrow();
  });

  it('CustomEvent(type)', () => {
    const ev = new win.CustomEvent('click');
    expect(ev.bubbles).toBe(false);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(false);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('click');
    expect(ev.detail).toBe(null);
  });

  it('CustomEvent(type, eventInitDict)', () => {
    const eventInitDict = {
      bubbles: true,
      composed: true,
      detail: 88,
    };
    const ev = new win.CustomEvent('click', eventInitDict);
    expect(ev.bubbles).toBe(true);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(true);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('click');
    expect(ev.detail).toBe(88);
  });

  it('FocusEvent() requires type', () => {
    expect(() => {
      // @ts-ignore checking that it throws when not supplied required arguments
      new win.FocusEvent();
    }).toThrow();
  });

  const focusEventTypes: ('blur' | 'focus')[] = ['blur', 'focus'];
  it.each(focusEventTypes)('creates a %s-type MockFocusEvent', (focusType) => {
    const ev = new win.FocusEvent(focusType);
    expect(ev.bubbles).toBe(false);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(false);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe(focusType);
    expect(ev.relatedTarget).toBe(null);
  });

  it('FocusEvent(type, focusEventInitDic)', () => {
    const focusEventInitDic = {
      bubbles: true,
      composed: true,
      relatedTarget: null as EventTarget | null,
    };
    const ev = new win.FocusEvent('blur', focusEventInitDic);
    expect(ev.bubbles).toBe(true);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(true);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('blur');
    expect(ev.relatedTarget).toBe(null);
  });

  it('KeyboardEvent() requires type', () => {
    expect(() => {
      // @ts-ignore checking that it throws when not supplied required arguments
      new win.KeyboardEvent();
    }).toThrow();
  });

  it('KeyboardEvent(type)', () => {
    const ev = new win.KeyboardEvent('keyup');
    expect(ev.bubbles).toBe(false);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(false);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('keyup');
    expect(ev.code).toBe('');
    expect(ev.key).toBe('');
    expect(ev.altKey).toBe(false);
    expect(ev.ctrlKey).toBe(false);
    expect(ev.metaKey).toBe(false);
    expect(ev.shiftKey).toBe(false);
    expect(ev.location).toBe(0);
    expect(ev.repeat).toBe(false);
  });

  it('KeyboardEvent(type, eventInitDict)', () => {
    const eventInitDict = {
      bubbles: true,
      composed: true,
      code: 'KeyA',
      key: 'A',
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      location: 0,
      repeat: true,
    };
    const ev = new win.KeyboardEvent('keyup', eventInitDict);
    expect(ev.bubbles).toBe(true);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(true);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('keyup');
    expect(ev.code).toBe('KeyA');
    expect(ev.key).toBe('A');
    expect(ev.altKey).toBe(false);
    expect(ev.ctrlKey).toBe(false);
    expect(ev.metaKey).toBe(false);
    expect(ev.shiftKey).toBe(true);
    expect(ev.location).toBe(0);
    expect(ev.repeat).toBe(true);
  });

  it('MouseEvent() requires type', () => {
    expect(() => {
      // @ts-ignore checking that it throws when not supplied required args
      new win.MouseEvent();
    }).toThrow();
  });

  it('MouseEvent(type)', () => {
    const ev = new win.MouseEvent('onclick');
    expect(ev.bubbles).toBe(false);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(false);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('onclick');
    expect(ev.screenX).toBe(0);
    expect(ev.screenY).toBe(0);
    expect(ev.clientX).toBe(0);
    expect(ev.clientY).toBe(0);
    expect(ev.ctrlKey).toBe(false);
    expect(ev.shiftKey).toBe(false);
    expect(ev.altKey).toBe(false);
    expect(ev.metaKey).toBe(false);
    expect(ev.button).toBe(0);
    expect(ev.buttons).toBe(0);
    expect(ev.relatedTarget).toBe(null);
  });

  it('MouseEvent(type, eventInitDict)', () => {
    const eventInitDict: MouseEventInit = {
      bubbles: true,
      composed: true,
      screenX: 99,
      screenY: 99,
      clientX: 99,
      clientY: 99,
      ctrlKey: false,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      button: 0,
      buttons: 99,
      relatedTarget: null,
    };
    const ev = new win.MouseEvent('onmousedown', eventInitDict);
    expect(ev.bubbles).toBe(true);
    expect(ev.cancelBubble).toBe(false);
    expect(ev.cancelable).toBe(false);
    expect(ev.composed).toBe(true);
    expect(ev.currentTarget).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
    expect(ev.srcElement).toBe(null);
    expect(ev.target).toBe(null);
    expect(typeof ev.timeStamp).toBe('number');
    expect(ev.type).toBe('onmousedown');
    expect(ev.screenX).toBe(99);
    expect(ev.screenY).toBe(99);
    expect(ev.clientX).toBe(99);
    expect(ev.clientY).toBe(99);
    expect(ev.ctrlKey).toBe(false);
    expect(ev.shiftKey).toBe(true);
    expect(ev.altKey).toBe(false);
    expect(ev.metaKey).toBe(false);
    expect(ev.button).toBe(0);
    expect(ev.buttons).toBe(99);
    expect(ev.relatedTarget).toBe(null);
  });

  describe('composedPath', () => {
    let doc: MockDocument;

    beforeEach(() => {
      doc = win.document as unknown as MockDocument;
    });

    it('returns an empty path with no target', () => {
      const event = new MockEvent('onclick', { bubbles: true });
      expect(event.composedPath()).toHaveLength(0);
    });

    it('returns the correct path for a simple div element', () => {
      const event = new MockEvent('onclick', { bubbles: true });

      const divElm = new MockElement(doc, 'div');
      divElm.textContent = 'simple div text';
      doc.body.appendChild(divElm);

      divElm.dispatchEvent(event);

      const composedPath = event.composedPath();

      expect(composedPath).toHaveLength(5);
      expect(composedPath[0]).toBe(divElm);
      expect(composedPath[1]).toBe(doc.body);
      expect(composedPath[2]).toBe(doc.documentElement);
      expect(composedPath[3]).toBe(doc);
      expect(composedPath[4]).toBe(win);
    });

    it('returns the correct path for a nested element', () => {
      const event = new MockEvent('onclick', { bubbles: true });

      const divElm = new MockElement(doc, 'div');
      doc.body.appendChild(divElm);

      const pElm = new MockElement(doc, 'p');
      pElm.textContent = 'simple p text';
      divElm.appendChild(pElm);

      pElm.dispatchEvent(event);

      const composedPath = event.composedPath();

      expect(composedPath).toHaveLength(6);
      expect(composedPath[0]).toBe(pElm);
      expect(composedPath[1]).toBe(divElm);
      expect(composedPath[2]).toBe(doc.body);
      expect(composedPath[3]).toBe(doc.documentElement);
      expect(composedPath[4]).toBe(doc);
      expect(composedPath[5]).toBe(win);
    });
  });
});
