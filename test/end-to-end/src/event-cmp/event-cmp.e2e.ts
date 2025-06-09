import { newE2EPage } from '@stencil/core/testing';

describe('@Event', () => {
  it('should fire custom event on window', async () => {
    // create a new puppeteer page
    // and load the page with html content
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    // select the "event-cmp" element within the page (same as querySelector)
    const elm = await page.find('event-cmp');

    // add an event listener on window BEFORE we fire off the event
    const eventSpy = await elm.spyOnEvent('myWindowEvent');

    // call the component's "methodThatFiresMyWindowEvent()" method
    // when calling the method it is executing it within the browser's context
    // we're using the @Method here to manually trigger an event from the component for testing
    await elm.callMethod('methodThatFiresMyWindowEvent', 88);

    const receivedEvent = eventSpy.lastEvent;

    // the event has been received, test we have the correct values
    expect(receivedEvent.bubbles).toEqual(true);
    expect(receivedEvent.cancelBubble).toEqual(false);
    expect(receivedEvent.cancelable).toEqual(true);
    expect(receivedEvent.composed).toEqual(true);
    expect(receivedEvent.defaultPrevented).toEqual(false);
    expect(receivedEvent.detail).toEqual(88);
    expect(receivedEvent.isTrusted).toEqual(false);
    expect(receivedEvent.returnValue).toEqual(true);
    expect(receivedEvent.timeStamp).toBeDefined();
    expect(receivedEvent.type).toEqual('myWindowEvent');
  });

  it('should fire custom event on document', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    const elm = await page.find('event-cmp');
    const elmEventSpy = await elm.spyOnEvent('myDocumentEvent');

    await elm.callMethod('methodThatFiresMyDocumentEvent');

    const receivedEvent = elmEventSpy.lastEvent;

    expect(receivedEvent.bubbles).toEqual(true);
    expect(receivedEvent.cancelBubble).toEqual(false);
    expect(receivedEvent.cancelable).toEqual(true);
    expect(receivedEvent.composed).toEqual(true);
    expect(receivedEvent.defaultPrevented).toEqual(false);
    expect(receivedEvent.detail).toEqual(null);
    expect(receivedEvent.isTrusted).toEqual(false);
    expect(receivedEvent.returnValue).toEqual(true);
    expect(receivedEvent.timeStamp).toBeDefined();
  });

  it('should fire custom event w/ no options', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    const elm = await page.find('event-cmp');
    const elmEventSpy = await elm.spyOnEvent('my-event-with-options');

    await elm.callMethod('methodThatFiresEventWithOptions', 88);

    expect(elmEventSpy).toHaveReceivedEventTimes(1);

    const receivedEvent = elmEventSpy.lastEvent;

    expect(receivedEvent.bubbles).toBe(false);
    expect(receivedEvent.cancelable).toBe(false);
    expect(receivedEvent.detail).toEqual({ mph: 88 });
  });

  it('spyOnEvent, toHaveReceivedEventTimes', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    const elm = await page.find('event-cmp');
    const elmEventSpy = await elm.spyOnEvent('my-event-with-options');

    await elm.callMethod('methodThatFiresEventWithOptions', 80);
    await elm.callMethod('methodThatFiresEventWithOptions', 90);
    await elm.callMethod('methodThatFiresEventWithOptions', 100);

    expect(elmEventSpy).toHaveReceivedEventTimes(3);
    expect(elmEventSpy).toHaveFirstReceivedEventDetail({ mph: 80 });
    expect(elmEventSpy).toHaveLastReceivedEventDetail({ mph: 100 });
  });

  it('element spyOnEvent', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    const elm = await page.find('event-cmp');
    const elmEventSpy = await elm.spyOnEvent('my-event-with-options');

    expect(elmEventSpy).not.toHaveReceivedEvent();

    await elm.callMethod('methodThatFiresEventWithOptions', 88);

    await page.waitForChanges();

    expect(elmEventSpy).toHaveReceivedEvent();
  });

  it('page spyOnEvent, default window', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    const eventSpy = await page.spyOnEvent('someEvent');

    const elm = await page.find('event-cmp');
    await elm.triggerEvent('someEvent', { detail: 88 });

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEventDetail(88);
  });

  it('page spyOnEvent, set document selector', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    const eventSpy = await page.spyOnEvent('someEvent', 'document');

    const elm = await page.find('event-cmp');
    await elm.triggerEvent('someEvent', { detail: 88 });

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEventDetail(88);
  });

  it('page waitForEvent', async () => {
    const page = await newE2EPage({
      html: `
      <event-cmp></event-cmp>
    `,
    });

    setTimeout(async () => {
      const elm = await page.find('event-cmp');
      await elm.triggerEvent('someEvent', { detail: 88 });
      await page.waitForChanges();
    }, 100);

    const ev = await page.waitForEvent('someEvent');

    expect(ev.type).toBe('someEvent');
    expect(ev.detail).toBe(88);
  });
});
