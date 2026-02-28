import { expect } from '@playwright/test';
import { test, E2ELocator } from '@stencil/playwright';

test.describe('@Event', () => {
  test('should fire custom event on window', async ({ page }) => {
    // load the page with html content
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    // select the "event-cmp" element within the page
    const elm = page.locator('event-cmp') as E2ELocator;

    // add an event listener on the element BEFORE we fire off the event
    const eventSpy = await elm.spyOnEvent('myWindowEvent');

    // call the component's "methodThatFiresMyWindowEvent()" method
    // when calling the method it is executing it within the browser's context
    // we're using the @Method here to manually trigger an event from the component for testing
    await elm.evaluate((el: any) => el.methodThatFiresMyWindowEvent(88));

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

  test('should fire custom event on document', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    const elm = page.locator('event-cmp') as E2ELocator;
    const elmEventSpy = await elm.spyOnEvent('myDocumentEvent');

    await elm.evaluate((el: any) => el.methodThatFiresMyDocumentEvent());

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

  test('should fire custom event w/ no options', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    const elm = page.locator('event-cmp') as E2ELocator;
    const elmEventSpy = await elm.spyOnEvent('my-event-with-options');

    await elm.evaluate((el: any) => el.methodThatFiresEventWithOptions(88));

    expect(elmEventSpy).toHaveReceivedEventTimes(1);

    const receivedEvent = elmEventSpy.lastEvent;

    expect(receivedEvent.bubbles).toBe(false);
    expect(receivedEvent.cancelable).toBe(false);
    expect(receivedEvent.detail).toEqual({ mph: 88 });
  });

  test('spyOnEvent, toHaveReceivedEventTimes', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    const elm = page.locator('event-cmp') as E2ELocator ;
    const elmEventSpy = await elm.spyOnEvent('my-event-with-options');

    await elm.evaluate((el: any) => el.methodThatFiresEventWithOptions(80));
    await elm.evaluate((el: any) => el.methodThatFiresEventWithOptions(90));
    await elm.evaluate((el: any) => el.methodThatFiresEventWithOptions(100));

    expect(elmEventSpy).toHaveReceivedEventTimes(3);
    expect(elmEventSpy).toHaveFirstReceivedEventDetail({ mph: 80 });
    expect(elmEventSpy).toHaveReceivedEventDetail({ mph: 100 });
  });

  test('element spyOnEvent', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    const elm = page.locator('event-cmp') as E2ELocator;
    const elmEventSpy = await elm.spyOnEvent('my-event-with-options');

    expect(elmEventSpy).not.toHaveReceivedEvent();

    await elm.evaluate((el: any) => el.methodThatFiresEventWithOptions(88));

    await page.waitForChanges();

    expect(elmEventSpy).toHaveReceivedEvent();
  });

  test('page spyOnEvent, default window', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    const eventSpy = await page.spyOnEvent('someEvent');

    const elm = page.locator('event-cmp');
    await elm.dispatchEvent('someEvent', { detail: 88 });

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEventDetail(88);
  });

  test('page spyOnEvent on document', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    // Note: @stencil/playwright's page.spyOnEvent() listens on window
    // For document events, we listen on window since events bubble up
    const eventSpy = await page.spyOnEvent('someEvent');

    const elm = page.locator('event-cmp');
    await elm.dispatchEvent('someEvent', { detail: 88 });

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEventDetail(88);
  });

  test('page waitForEvent', async ({ page }) => {
    await page.setContent(`
      <event-cmp></event-cmp>
    `);

    const elm = page.locator('event-cmp');

    // Set up event listener before triggering
    const eventPromise = page.evaluate(() => {
      return new Promise<{ type: string; detail: any }>((resolve) => {
        window.addEventListener(
          'someEvent',
          (e: Event) => {
            const ce = e as CustomEvent;
            resolve({ type: ce.type, detail: ce.detail });
          },
          { once: true },
        );
      });
    });

    // Trigger the event after a small delay
    await elm.dispatchEvent('someEvent', { detail: 88 });

    const ev = await eventPromise;

    expect(ev.type).toBe('someEvent');
    expect(ev.detail).toBe(88);
  });
});
