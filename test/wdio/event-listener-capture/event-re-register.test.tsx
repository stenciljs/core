// @ts-expect-error will be resolved by WDIO
import { defineCustomElement } from '/test-components/event-re-register.js';

defineCustomElement();

describe('event-listener-capture using lazy load components', function () {
  const eventListenerCaptureCmp = () => $('event-re-register');

  afterEach(() => {
    const elem = document.querySelector('event-re-register') as HTMLElement;
    if (elem) {
      elem.remove();
    }
  });

  it('should only attach keydown event listener once', async () => {
    const elem = document.createElement('event-re-register') as HTMLElement;
    document.body.appendChild(elem);

    const reattach = eventListenerCaptureCmp();
    await expect(reattach).toBePresent();

    // focus on element
    await reattach.click();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();

    // check if event fired 3 times
    await expect(reattach).toHaveText(expect.stringContaining('Event fired times: 3'));

    // remove node from DOM
    elem.remove();

    // reattach node to DOM
    document.body.appendChild(elem);

    // retrigger event
    await reattach.click();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();

    // check if event fired 6 times
    await expect(reattach).toHaveText(expect.stringContaining('Event fired times: 6'));
  });

  it('should attach keydown event listener once per component', async () => {
    const elem = document.createElement('event-re-register') as HTMLElement;
    elem.setAttribute('id', 'elem1');
    document.body.appendChild(elem);

    const reattach = $('#elem1');
    await expect(reattach).toBePresent();

    // focus on element 1
    await reattach.click();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();

    // check if event fired 3 times on first element
    await expect(reattach).toHaveText(expect.stringContaining('Event fired times: 3'), {
      message: 'Second element should have fired 3 times',
    });

    const elem2 = document.createElement('event-re-register') as HTMLElement;
    elem2.setAttribute('id', 'elem2');
    document.body.appendChild(elem2);

    const reattach2 = $('#elem2');
    await expect(reattach2).toBePresent();

    // focus on element 2
    await reattach2.click();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();

    // check if event fired 3 times on second element
    await expect(reattach2).toHaveText(expect.stringContaining('Event fired times: 3'), {
      message: 'Second element should have fired 3 times',
    });

    // remove node from DOM
    elem.remove();
    elem2.remove();

    // reattach node to DOM
    document.body.appendChild(elem);
    document.body.appendChild(elem2);

    // retrigger event
    await reattach.click();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();

    // check if event fired 6 times on first element
    await expect(reattach).toHaveText(expect.stringContaining('Event fired times: 6'), {
      message: 'First element should have fired 3 times',
    });

    // retrigger event on element 2
    await reattach2.click();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();
    await browser.action('key').down('a').pause(100).up('a').perform();

    // check if event fired 3 times on second element
    await expect(reattach2).toHaveText(expect.stringContaining('Event fired times: 6'), {
      message: 'Second element should have fired 3 times',
    });
  });
});
