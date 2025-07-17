import './variables.css';

import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { browser } from '@wdio/globals';

const css = `:root {
  --global-background: black;
  --global-color: white;
  --body-background: grey;
}
body {
  background: var(--body-background);
  color: var(--global-color);
}`;

describe('css-variables', () => {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <style>{css}</style>

          <css-variables-no-encapsulation></css-variables-no-encapsulation>
          <css-variables-shadow-dom></css-variables-shadow-dom>
          {/* This second instance will be used to ensure encapsulation between it and the first instance */}
          <css-variables-shadow-dom></css-variables-shadow-dom>
        </>
      ),
    });
  });

  describe('css-variables-no-encapsulation', () => {
    it('uses class-local css variables to set the background and color', async () => {
      const blackLocalElm = await $('.black-local');

      await expect(blackLocalElm).toHaveText('No encapsulation: Black background');
      await expect(blackLocalElm).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(0, 0, 0, 1)' : 'rgb(0, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(255,255,255,1)' : 'rgb(255,255,255)',
      });
    });

    it('uses global css variables to set the background, color, and font weight', async () => {
      const blackGlobalElm = await $('.black-global');

      await expect(blackGlobalElm).toHaveText('No encapsulation: Black background (global style)');
      await expect(blackGlobalElm).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(0, 0, 0, 1)' : 'rgb(0, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(255,255,255,1)' : 'rgb(255,255,255)',
      });

      const fontWeight = await blackGlobalElm.getCSSProperty('font-weight');
      expect(fontWeight.value).toEqual(800);
    });

    it('uses imported css variables to set the background and color', async () => {
      const yellowGlobalElm = await $('.yellow-global');

      await expect(yellowGlobalElm).toHaveText('No encapsulation: Yellow background (global link)');
      await expect(yellowGlobalElm).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(255, 255, 0, 1)' : 'rgb(255, 255, 0)'}`,
        color: browser.isChromium ? 'rgba(0,0,0,1)' : 'rgb(0,0,0)',
      });
    });
  });

  describe('css-variables-shadow-dom', () => {
    it("doesn't interfere with global variables", async () => {
      const globalShadow = await $('>>>.black-global-shadow');

      await expect(globalShadow).toHaveText('Shadow: Black background (global)');
      await expect(globalShadow).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(0, 0, 0, 1)' : 'rgb(0, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(255,255,255,1)' : 'rgb(255,255,255)',
      });
      let fontWeight = await globalShadow.getCSSProperty('font-weight');
      expect(fontWeight.value).toEqual(800);

      await $('css-variables-shadow-dom').$('>>> button').click();

      await expect(globalShadow).toHaveText('Shadow: Black background (global)');
      await expect(globalShadow).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(0, 0, 0, 1)' : 'rgb(0, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(255,255,255,1)' : 'rgb(255,255,255)',
      });
      fontWeight = await globalShadow.getCSSProperty('font-weight');
      expect(fontWeight.value).toEqual(800);
    });

    it('repaints as a result of changing css variables', async () => {
      const innerDiv = $('>>>.inner-div');

      await expect(innerDiv).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(255, 0, 0, 1)' : 'rgb(255, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(0,0,255,1)' : 'rgb(0,0,255)',
      });

      await $('css-variables-shadow-dom').$('>>> button').click();

      await expect(innerDiv).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(0, 128, 0, 1)' : 'rgb(0, 128, 0)'}`,
        color: browser.isChromium ? 'rgba(0,0,255,1)' : 'rgb(0,0,255)',
      });
    });

    it('changes the text as a result of changing css variables', async () => {
      const innerDiv = $('>>>.inner-div');

      await expect(innerDiv).toHaveText('Shadow: Red background');

      await $('css-variables-shadow-dom').$('>>> button').click();

      await expect(innerDiv).toHaveText('Shadow: Green background');
    });

    it("doesn't change the font weight as a result of changing css variables", async () => {
      const innerDiv = $('>>>.inner-div');

      let fontWeight = await innerDiv.getCSSProperty('font-weight');
      expect(fontWeight.value).toEqual(400);

      await $('css-variables-shadow-dom').$('>>> button').click();

      fontWeight = await innerDiv.getCSSProperty('font-weight');
      await expect(fontWeight.value).toEqual(400);
    });

    it("doesn't alter a second instance of the element", async () => {
      // grab a reference to the second inner-div class to verify it's background does not change
      const innerDiv = await $$('css-variables-shadow-dom')[1].$('>>>.inner-div');

      await expect(innerDiv).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(255, 0, 0, 1)' : 'rgb(255, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(0,0,255,1)' : 'rgb(0,0,255)',
      });

      const button = await $$('css-variables-shadow-dom')[0].$('>>> button');
      await button.click();

      await expect(innerDiv).toHaveStyle({
        background: `none 0% 0% auto repeat padding-box border-box scroll ${browser.isChromium ? 'rgba(255, 0, 0, 1)' : 'rgb(255, 0, 0)'}`,
        color: browser.isChromium ? 'rgba(0,0,255,1)' : 'rgb(0,0,255)',
      });
    });
  });
});
