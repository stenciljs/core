import { describe, it, expect, beforeEach } from '@stencil/vitest';
import { MockDocument } from '../document';
import { MockWindow } from '../window';

describe('Shadow DOM event bubbling', () => {
  let win: MockWindow;
  let doc: MockDocument;

  beforeEach(() => {
    win = new MockWindow();
    doc = win.document as unknown as MockDocument;
  });

  it('should allow events to bubble from shadow DOM children to shadow host when composed: true', () => {
    const parentHost = doc.createElement('my-parent');
    const parentShadow = parentHost.attachShadow({ mode: 'open' });

    const childHost = doc.createElement('my-child');
    childHost.attachShadow({ mode: 'open' });

    doc.body.appendChild(parentHost);
    parentShadow.appendChild(childHost);

    let parentEventReceived = false;
    let receivedEventType = '';
    let receivedComposed = false;

    parentHost.addEventListener('custom-event', (event: any) => {
      parentEventReceived = true;
      receivedEventType = event.type;
      receivedComposed = event.composed;
    });

    const customEvent = new Event('custom-event', {
      bubbles: true,
      composed: true,
    });

    childHost.dispatchEvent(customEvent);

    expect(parentEventReceived).toBe(true);
    expect(receivedEventType).toBe('custom-event');
    expect(receivedComposed).toBe(true);
  });

  it('should NOT allow events to bubble across shadow boundaries when composed: false', () => {
    const parentHost = doc.createElement('my-parent');
    const parentShadow = parentHost.attachShadow({ mode: 'open' });

    const childHost = doc.createElement('my-child');

    doc.body.appendChild(parentHost);
    parentShadow.appendChild(childHost);

    let parentEventReceived = false;

    parentHost.addEventListener('custom-event', () => {
      parentEventReceived = true;
    });

    const customEvent = new Event('custom-event', {
      bubbles: true,
      composed: false, // This should NOT cross shadow boundaries
    });

    childHost.dispatchEvent(customEvent);

    expect(parentEventReceived).toBe(false);
  });

  it('should work with CustomEvent and detail property', () => {
    const parentHost = doc.createElement('my-parent');
    const parentShadow = parentHost.attachShadow({ mode: 'open' });

    const childHost = doc.createElement('my-child');

    doc.body.appendChild(parentHost);
    parentShadow.appendChild(childHost);

    let receivedDetail: any = null;

    parentHost.addEventListener('custom-event', (event: any) => {
      receivedDetail = event.detail;
    });

    const customEvent = new CustomEvent('custom-event', {
      bubbles: true,
      composed: true,
      detail: { message: 'test data', value: 42 },
    });

    childHost.dispatchEvent(customEvent);

    expect(receivedDetail).toEqual({ message: 'test data', value: 42 });
  });
});
