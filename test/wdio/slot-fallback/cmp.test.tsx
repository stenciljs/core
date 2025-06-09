import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-fallback', () => {
  beforeEach(() => {
    render({
      template: () => <slot-fallback-root></slot-fallback-root>,
    });
  });

  it('renders fallback', async () => {
    // show fallback content
    await expect($('.results1 slot-fb[name="start"]:not([hidden])')).toHaveText('slot start fallback 0');
    await expect($('.results1 section slot-fb:not([hidden])')).toHaveText('slot default fallback 0');
    await expect($('.results1 article span slot-fb[name="end"]:not([hidden])')).toHaveText('slot end fallback 0');

    // update fallback content
    await $('button.change-fallback-content').click();
    await browser.pause();

    await expect($('.results1 slot-fb[name="start"]:not([hidden])')).toHaveText('slot start fallback 1');
    await expect($('.results1 section slot-fb:not([hidden])')).toHaveText('slot default fallback 1');
    await expect($('.results1 article span slot-fb[name="end"]:not([hidden])')).toHaveText('slot end fallback 1');

    // set light dom instead and hide fallback content
    await $('button.change-light-dom').click();
    await browser.pause();

    // fallback content hidden but still the same
    // WebdriverIO's `getText` command can only fetch a visible text, which is why we don't use it here
    expect(document.body.querySelector('.results1 slot-fb[name="start"][hidden]').textContent.trim()).toBe(
      'slot start fallback 1',
    );
    expect(document.body.querySelector('.results1 section slot-fb[hidden]').textContent.trim()).toBe(
      'slot default fallback 1',
    );
    expect(document.body.querySelector('.results1 article span slot-fb[name="end"][hidden]').textContent.trim()).toBe(
      'slot end fallback 1',
    );

    // light dom content rendered
    await expect($('.results1 content-start')).toHaveText('slot light dom 0 : start');
    await expect($('.results1 section content-default')).toHaveText('slot light dom 0 : default');
    await expect($('.results1 article span content-end')).toHaveText('slot light dom 0 : end');

    await $('button.change-fallback-content').click();
    await $('button.change-slot-content').click();
    await browser.pause();

    // fallback content hidden and updated content
    // WebdriverIO's `getText` command can only fetch a visible text, which is why we don't use it here
    expect(document.querySelector('.results1 slot-fb[name="start"][hidden]').textContent.trim()).toBe(
      'slot start fallback 2',
    );
    expect(document.querySelector('.results1 section slot-fb[hidden]').textContent.trim()).toBe(
      'slot default fallback 2',
    );
    expect(document.querySelector('.results1 article span slot-fb[name="end"][hidden]').textContent.trim()).toBe(
      'slot end fallback 2',
    );

    // light dom content updated
    await expect($('.results1 content-start')).toHaveText('slot light dom 1 : start');
    await expect($('.results1 section content-default')).toHaveText('slot light dom 1 : default');
    await expect($('.results1 article span content-end')).toHaveText('slot light dom 1 : end');

    // change back to fallback content
    await $('button.change-light-dom').click();
    await browser.pause();

    // fallback content should not be hidden
    await expect($('.results1 slot-fb[name="start"]:not([hidden])')).toHaveText('slot start fallback 2');
    await expect($('.results1 section slot-fb:not([hidden])')).toHaveText('slot default fallback 2');
    await expect($('.results1 article span slot-fb[name="end"]:not([hidden])')).toHaveText('slot end fallback 2');

    // light dom content should not exist
    await expect($('.results1 content-start')).not.toBeExisting();
    await expect($('.results1 section content-default')).not.toBeExisting();
    await expect($('.results1 article span content-end')).not.toBeExisting();

    // update content
    await $('button.change-fallback-content').click();
    await $('button.change-slot-content').click();
    await browser.pause();

    // fallback content should not be hidden
    await expect($('.results1 slot-fb[name="start"]:not([hidden])')).toHaveText('slot start fallback 3');
    await expect($('.results1 section slot-fb:not([hidden])')).toHaveText('slot default fallback 3');
    await expect($('.results1 article span slot-fb[name="end"]:not([hidden])')).toHaveText('slot end fallback 3');

    // light dom content should not exist
    await expect($('.results1 content-start')).not.toBeExisting();
    await expect($('.results1 section content-default')).not.toBeExisting();
    await expect($('.results1 article span content-end')).not.toBeExisting();

    // change back to showing slot content
    await $('button.change-light-dom').click();
    await browser.pause();

    // fallback content hidden and updated content
    // WebdriverIO's `getText` command can only fetch a visible text, which is why we don't use it here
    expect(document.querySelector('.results1 slot-fb[name="start"][hidden]').textContent.trim()).toBe(
      'slot start fallback 3',
    );
    expect(document.querySelector('.results1 section slot-fb[hidden]').textContent.trim()).toBe(
      'slot default fallback 3',
    );
    expect(document.querySelector('.results1 article span slot-fb[name="end"][hidden]').textContent.trim()).toBe(
      'slot end fallback 3',
    );

    // light dom content updated
    await expect($('.results1 content-start')).toHaveText('slot light dom 2 : start');
    await expect($('.results1 section content-default')).toHaveText('slot light dom 2 : default');
    await expect($('.results1 article span content-end')).toHaveText('slot light dom 2 : end');
  });

  it('should have correct display style on slot-fb element', () => {
    const slotFbElements = document.body.querySelectorAll<HTMLElement>('slot-fallback-root slot-fallback slot-fb');
    slotFbElements.forEach((slotFb) => expect(getComputedStyle(slotFb).display).toBe('contents'));
  });

  it('should hide slot-fb elements when slotted content exists', async () => {
    // Show slotted content
    await $('button.change-light-dom').click();
    await browser.pause();

    const slotFbElements = document.body.querySelectorAll<HTMLElement>('slot-fallback-root slot-fallback slot-fb');
    slotFbElements.forEach((slotFb) => expect(getComputedStyle(slotFb).display).toBe('none'));
  });
});
