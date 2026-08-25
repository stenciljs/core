import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('reflect-to-attr', function () {
  beforeEach(async () => {
    function toggleDisabled() {
      const item = document.querySelector('reflect-to-attr');
      item.disabled = !item.disabled;
    }

    render({
      template: () => (
        <>
          <reflect-to-attr></reflect-to-attr>
          <button id="toggle" onClick={toggleDisabled}>
            Toggle disabled
          </button>
        </>
      ),
    });
  });

  it('should have proper attributes', async () => {
    await $('reflect-to-attr').waitForExist();
    const cmp = document.querySelector('reflect-to-attr');

    await expect($(cmp)).toHaveAttr('str', 'single');
    expect(cmp.getAttribute('nu')).toEqual('2');
    expect(cmp.getAttribute('undef')).toEqual(null);
    expect(cmp.getAttribute('null')).toEqual(null);
    expect(cmp.getAttribute('bool')).toEqual(null);
    expect(cmp.getAttribute('other-bool')).toEqual('');

    cmp.str = 'second';
    cmp.nu = -12.2;
    cmp.undef = 'no undef';
    cmp.null = 'no null';
    cmp.bool = true;
    cmp.otherBool = false;

    await browser.pause();

    expect(cmp.getAttribute('str')).toEqual('second');
    expect(cmp.getAttribute('nu')).toEqual('-12.2');
    expect(cmp.getAttribute('undef')).toEqual('no undef');
    expect(cmp.getAttribute('null')).toEqual('no null');
    expect(cmp.getAttribute('bool')).toEqual('');
    expect(cmp.getAttribute('other-bool')).toEqual(null);

    expect(cmp.getAttribute('dynamic-str')).toEqual('value');
    expect(cmp.getAttribute('dynamic-nu')).toEqual('123');
  });

  it('should not overwrite a reflected any-typed prop with its own reflected attribute', async () => {
    await $('reflect-to-attr').waitForExist();
    const cmp = document.querySelector('reflect-to-attr');

    // reflecting `true` writes the empty attribute and `false` removes it. Neither may be
    // assigned back onto the prop, since an `any` prop isn't coerced.
    cmp.anyVal = true;
    await browser.pause();
    expect(cmp.getAttribute('any-val')).toEqual('');
    expect(cmp.anyVal).toBe(true);

    cmp.anyVal = false;
    await browser.pause();
    expect(cmp.getAttribute('any-val')).toEqual(null);
    expect(cmp.anyVal).toBe(false);

    cmp.anyVal = 0;
    await browser.pause();
    expect(cmp.anyVal).toBe(0);

    // an external attribute write still wins
    cmp.setAttribute('any-val', 'external');
    await browser.pause();
    expect(cmp.anyVal).toBe('external');
  });

  it('should reflect booleans property', async () => {
    await $('reflect-to-attr').waitForExist();
    const cmp = document.querySelector('reflect-to-attr');
    expect(cmp.disabled).toBe(false);

    const toggle = $('#toggle');
    await toggle.click();

    await browser.waitUntil(async () => cmp.disabled);
    expect(cmp.disabled).toBe(true);

    await toggle.click();
    await browser.waitUntil(async () => !cmp.disabled);
    expect(cmp.disabled).toBe(false);
  });
});
