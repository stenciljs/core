import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('style-plugin', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <h1>Styles!</h1>
          <h2>Hurray!</h2>
          <hr />
          <css-cmp></css-cmp>
          <sass-cmp></sass-cmp>
          <multiple-styles-cmp></multiple-styles-cmp>
        </>
      ),
    });
  });

  it('sass-cmp', async () => {
    await $('sass-cmp').waitForExist();
    const sassHost = document.querySelector('sass-cmp');
    const shadowRoot = sassHost.shadowRoot;

    await $('>>>.sass-entry').waitForExist();
    const sassEntry = shadowRoot.querySelector('.sass-entry');
    const sassImportee = shadowRoot.querySelector('.sass-importee');
    const cssImportee = shadowRoot.querySelector('.css-importee');
    const bootstrapBtn = shadowRoot.querySelector('.btn-primary');
    const hr = shadowRoot.querySelector('hr');

    expect(window.getComputedStyle(sassEntry).color).toBe('rgb(255, 0, 0)');
    expect(window.getComputedStyle(sassImportee).color).toBe('rgb(0, 128, 0)');
    expect(window.getComputedStyle(cssImportee).color).toBe('rgb(0, 0, 255)');
    expect(window.getComputedStyle(bootstrapBtn).color).toBe('rgb(255, 255, 255)');
    expect(window.getComputedStyle(hr).height).toBe('0px');
  });

  it('css-cmp', async () => {
    await $('css-cmp').waitForExist();
    const cssHost = document.querySelector('css-cmp');
    const shadowRoot = cssHost.shadowRoot;

    await $('>>>.css-entry').waitForExist();
    const cssEntry = shadowRoot.querySelector('.css-entry');
    const cssImportee = shadowRoot.querySelector('.css-importee');
    const hr = shadowRoot.querySelector('hr');

    expect(window.getComputedStyle(cssEntry).color).toBe('rgb(128, 0, 128)');
    expect(window.getComputedStyle(cssImportee).color).toBe('rgb(0, 0, 255)');
    expect(window.getComputedStyle(hr).height).toBe('0px');
  });

  it('multiple-styles-cmp', async () => {
    await $('multiple-styles-cmp').waitForExist();
    const cssHost = document.querySelector('multiple-styles-cmp');
    const shadowRoot = cssHost.shadowRoot;

    await $('>>>h1').waitForExist();
    const h1 = getComputedStyle(shadowRoot.querySelector('h1'));
    const div = getComputedStyle(shadowRoot.querySelector('p'));
    // color is red because foo.scss is mentioned last and overwrites bar.scss
    expect(h1.color).toEqual('rgb(255, 0, 0)');
    expect(div.color).toEqual('rgb(255, 0, 0)');
    // ensure styles defined in bar.scss are applied too
    expect(h1.fontStyle).toEqual('italic');
    expect(div.fontStyle).toEqual('italic');
  });
});
