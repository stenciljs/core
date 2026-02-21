import { newE2EPage } from '@stencil/core/testing';

describe('@Listen', () => {
  it('host listener toggles "opened" from "click" event', async () => {
    // create a new puppeteer page
    const page = await newE2EPage({
      html: `
      <listen-cmp></listen-cmp>
    `,
    });

    // select the "event-cmp" element within the page (same as querySelector)
    // and return the value from the component's "opened" @Prop
    const elm = await page.find('listen-cmp');

    // we just made a change and now the async queue need to process it
    // make sure the queue does its work before we continue
    await page.waitForChanges();

    // test that the value we got from the element's "opened" property is correct
    expect(await elm.getProperty('opened')).toEqual(false);

    // simulated "click" event triggered from the element
    await elm.triggerEvent('click');

    // apply our changes and wait for updates
    await page.waitForChanges();

    // test that the event that we manually dispatched correctly
    // triggered the component's @Listen('click') handler which
    // in this test should have changed the "opened" value to true
    expect(await elm.getProperty('opened')).toEqual(true);

    // let's do it again!
    await elm.triggerEvent('click');

    await page.waitForChanges();

    // let's get the value of "opened" again
    expect(await elm.getProperty('opened')).toEqual(false);
  });
});
