/// <reference types="webdriverio" />
import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('scoped-basic', function () {
  beforeEach(() => {
    render({
      components: [],
      template: () => <scoped-basic-root colormode="md"></scoped-basic-root>,
    });
  });

  it('render', async () => {
    const doc = await $('scoped-basic-root');
    await doc.waitForStable();

    await expect(doc).toHaveElementClass(expect.stringContaining('sc-scoped-basic-root-md-h'));
    await expect(doc).toHaveElementClass(expect.stringContaining('hydrated'));

    const scopedEl = await $('scoped-basic');
    await scopedEl.waitForStable();

    await expect(scopedEl).toHaveElementClass(expect.stringContaining('sc-scoped-basic-root-md'));
    await expect(scopedEl).toHaveElementClass(expect.stringContaining('sc-scoped-basic-h'));
    await expect(scopedEl).toHaveElementClass(expect.stringContaining('hydrated'));

    await expect(scopedEl).toHaveStyle({
      backgroundColor: browser.isChromium ? 'rgba(0,0,0,1)' : browser.isFirefox ? '' : 'rgb(0,0,0)',
      color: browser.isChromium ? 'rgba(128,128,128,1)' : 'rgb(128,128,128)',
    });

    const scopedDiv = await $('scoped-basic span');
    await expect(scopedDiv).toHaveElementClass(expect.stringContaining('sc-scoped-basic'));
    await expect(scopedDiv).toHaveStyle({
      color: browser.isChromium ? 'rgba(255,0,0,1)' : browser.isFirefox ? 'rgb(255,0,0)' : 'rgb(255, 0, 0)',
    });

    const scopedP = await $('scoped-basic p');
    await expect(scopedP).toHaveElementClass(expect.stringContaining('sc-scoped-basic'));
    await expect(scopedP).toHaveElementClass(expect.stringContaining('sc-scoped-basic-s'));

    const scopedSlot = await $('scoped-basic p span');
    await expect(scopedSlot).toHaveElementClass(expect.stringContaining('sc-scoped-basic-root-md'));
    await expect(scopedSlot).toHaveText('light');

    await expect(scopedSlot).toHaveStyle({
      color: browser.isChromium ? 'rgba(255,255,0,1)' : 'rgb(255,255,0)',
    });
  });
});
