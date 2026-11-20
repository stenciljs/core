import { newSpecPage } from '@stencil/core/testing';

import { EventInnerComponent, EventWrapperComponent } from './__fixtures__/shadow-events';

describe('shadow DOM event bubbling through spec pages', () => {
  it('bubbles composed events out of nested shadow roots to the wrapper host', async () => {
    const page = await newSpecPage({
      components: [EventWrapperComponent, EventInnerComponent],
      html: '<event-wrapper-component></event-wrapper-component>',
    });

    const wrapperHost = page.root;
    const eventSpy = jest.fn();
    wrapperHost.addEventListener('customClick', eventSpy);

    const button = wrapperHost.shadowRoot.querySelector('event-inner-component').shadowRoot.querySelector('button');
    button.click();
    await page.waitForChanges();

    expect(eventSpy).toHaveBeenCalledTimes(1);
  });

  it('retargets composed events to the wrapper host when crossing the boundaries', async () => {
    const page = await newSpecPage({
      components: [EventWrapperComponent, EventInnerComponent],
      html: '<event-wrapper-component></event-wrapper-component>',
    });

    const wrapperHost = page.root;
    let targetSeenFromWrapperListener: any = null;
    wrapperHost.addEventListener('customClick', (event: any) => {
      targetSeenFromWrapperListener = event.target;
    });

    const button = wrapperHost.shadowRoot.querySelector('event-inner-component').shadowRoot.querySelector('button');
    button.click();
    await page.waitForChanges();

    expect(targetSeenFromWrapperListener).toBe(wrapperHost);
  });
});
