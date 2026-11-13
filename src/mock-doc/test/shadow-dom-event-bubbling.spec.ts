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

describe('Shadow DOM event bubbling with nested shadow roots', () => {
  let win: MockWindow;
  let doc: MockDocument;

  beforeEach(() => {
    win = new MockWindow();
    doc = win.document as unknown as MockDocument;
  });

  it('bubbles composed events out of multiple nested shadow roots', () => {
    const wrapperHost = doc.createElement('section');
    const wrapperShadow = wrapperHost.attachShadow({ mode: 'open' });

    const innerHost = doc.createElement('article');
    const innerShadow = innerHost.attachShadow({ mode: 'open' });
    const button = doc.createElement('button');

    doc.body.appendChild(wrapperHost);
    wrapperShadow.appendChild(innerHost);
    innerShadow.appendChild(button);

    const wrapperListenerSpy = jest.fn();
    const wrapperShadowListenerSpy = jest.fn();
    const documentListenerSpy = jest.fn();

    wrapperHost.addEventListener('customclick', wrapperListenerSpy);
    wrapperShadow.addEventListener('customclick', wrapperShadowListenerSpy);
    doc.addEventListener('customclick', documentListenerSpy);

    button.dispatchEvent(new Event('customclick', { bubbles: true, composed: true }));

    expect(wrapperListenerSpy).toHaveBeenCalledTimes(1);
    expect(wrapperShadowListenerSpy).toHaveBeenCalledTimes(1);
    expect(documentListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('does not bubble non-composed events out of nested shadow roots', () => {
    const wrapperHost = doc.createElement('section');
    const wrapperShadow = wrapperHost.attachShadow({ mode: 'open' });

    const innerHost = doc.createElement('article');
    const innerShadow = innerHost.attachShadow({ mode: 'open' });
    const button = doc.createElement('button');

    doc.body.appendChild(wrapperHost);
    wrapperShadow.appendChild(innerHost);
    innerShadow.appendChild(button);

    const wrapperListenerSpy = jest.fn();
    wrapperHost.addEventListener('customclick', wrapperListenerSpy);

    button.dispatchEvent(new Event('customclick', { bubbles: true, composed: false }));

    expect(wrapperListenerSpy).not.toHaveBeenCalled();
  });

  it('retargets composed events to the shadow host when crossing the boundary', () => {
    const wrapperHost = doc.createElement('section');
    const wrapperShadow = wrapperHost.attachShadow({ mode: 'open' });

    const innerHost = doc.createElement('article');
    const innerShadow = innerHost.attachShadow({ mode: 'open' });
    const button = doc.createElement('button');

    doc.body.appendChild(wrapperHost);
    wrapperShadow.appendChild(innerHost);
    innerShadow.appendChild(button);

    let targetSeenFromButtonListener: any = null;
    let targetSeenFromInnerShadowListener: any = null;
    let targetSeenFromShadowListener: any = null;
    let targetSeenFromWrapperListener: any = null;
    let targetSeenFromDocumentListener: any = null;

    button.addEventListener('customclick', (event: any) => {
      targetSeenFromButtonListener = event.target;
    });
    innerShadow.addEventListener('customclick', (event: any) => {
      targetSeenFromInnerShadowListener = event.target;
    });
    wrapperShadow.addEventListener('customclick', (event: any) => {
      targetSeenFromShadowListener = event.target;
    });
    wrapperHost.addEventListener('customclick', (event: any) => {
      targetSeenFromWrapperListener = event.target;
    });
    doc.addEventListener('customclick', (event: any) => {
      targetSeenFromDocumentListener = event.target;
    });

    button.dispatchEvent(new Event('customclick', { bubbles: true, composed: true }));

    // listeners in the button's own shadow tree see the button
    expect(targetSeenFromButtonListener).toBe(button);
    expect(targetSeenFromInnerShadowListener).toBe(button);
    // listeners inside the wrapper's shadow root see the inner component's host
    expect(targetSeenFromShadowListener).toBe(innerHost);
    // listeners outside both shadow roots see the outermost host
    expect(targetSeenFromWrapperListener).toBe(wrapperHost);
    expect(targetSeenFromDocumentListener).toBe(wrapperHost);
  });
});

describe('Shadow DOM event retargeting with custom element hosts', () => {
  let win: MockWindow;
  let doc: MockDocument;

  beforeEach(() => {
    win = new MockWindow();
    doc = win.document as unknown as MockDocument;
  });

  it('retargets composed events to the object user code holds for unregistered custom elements', () => {
    // createElement for unregistered custom elements returns a proxy wrapper; the
    // retargeted event target must be that same object so tests can assert identity
    const wrapperHost = doc.createElement('my-wrapper-component');
    const wrapperShadow = wrapperHost.attachShadow({ mode: 'open' });

    const innerHost = doc.createElement('my-component');
    const innerShadow = innerHost.attachShadow({ mode: 'open' });
    const button = doc.createElement('button');

    doc.body.appendChild(wrapperHost);
    wrapperShadow.appendChild(innerHost);
    innerShadow.appendChild(button);

    let targetSeenFromWrapperListener: any = null;
    wrapperHost.addEventListener('customclick', (event: any) => {
      targetSeenFromWrapperListener = event.target;
    });

    button.dispatchEvent(new Event('customclick', { bubbles: true, composed: true }));

    expect(targetSeenFromWrapperListener).toBe(wrapperHost);
  });
});
