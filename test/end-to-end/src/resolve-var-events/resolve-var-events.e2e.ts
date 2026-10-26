import { newE2EPage } from '@stencil/core/testing';

describe('resolveVar with @Event and @Listen', () => {
  it('should fire and listen to event with resolved const variable', async () => {
    const page = await newE2EPage({
      html: `
      <resolve-var-events></resolve-var-events>
    `,
    });

    const elm = await page.find('resolve-var-events');
    await page.waitForChanges();

    const eventSpy = await elm.spyOnEvent('myEvent');

    await elm.callMethod('emitMyEvent');

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEvent();
    const myEventCount = await page.find('resolve-var-events >>> .my-event-count');
    expect(await myEventCount.textContent).toBe('1');
  });

  it('should fire and listen to event with resolved object property', async () => {
    const page = await newE2EPage({
      html: `
      <resolve-var-events></resolve-var-events>
    `,
    });

    const elm = await page.find('resolve-var-events');
    await page.waitForChanges();

    const eventSpy = await elm.spyOnEvent('otherEvent');

    await elm.callMethod('emitOtherEvent');

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEvent();
    const otherEventCount = await page.find('resolve-var-events >>> .other-event-count');
    expect(await otherEventCount.textContent).toBe('1');
  });

  it('should fire and listen to event with resolved object property imported from another module', async () => {
    const page = await newE2EPage({
      html: `
      <resolve-var-events></resolve-var-events>
    `,
    });

    const elm = await page.find('resolve-var-events');
    await page.waitForChanges();

    const eventSpy = await elm.spyOnEvent('importedEvent');

    await elm.callMethod('emitImportedEvent');

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEvent();
    const importedEventCount = await page.find('resolve-var-events >>> .imported-event-count');
    expect(await importedEventCount.textContent).toBe('1');
  });

  it('should handle multiple events with different resolved variables', async () => {
    const page = await newE2EPage({
      html: `
      <resolve-var-events></resolve-var-events>
    `,
    });

    const elm = await page.find('resolve-var-events');
    await page.waitForChanges();

    await elm.callMethod('emitMyEvent');
    await page.waitForChanges();

    await elm.callMethod('emitOtherEvent');
    await page.waitForChanges();

    await elm.callMethod('emitImportedEvent');
    await page.waitForChanges();

    const myEventCount = await page.find('resolve-var-events >>> .my-event-count');
    const otherEventCount = await page.find('resolve-var-events >>> .other-event-count');
    const importedEventCount = await page.find('resolve-var-events >>> .imported-event-count');

    expect(await myEventCount.textContent).toBe('1');
    expect(await otherEventCount.textContent).toBe('1');
    expect(await importedEventCount.textContent).toBe('1');
  });
});
