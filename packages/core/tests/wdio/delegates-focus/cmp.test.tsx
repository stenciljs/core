import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('delegates-focus', function () {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <button onClick={setFocus}>Set Focus</button>
          <hr />
          <div>Delegate Focus Enabled:</div>
          <delegates-focus class="set-focus"></delegates-focus>
          <hr />
          <div>Delegate Focus Not Enabled:</div>
          <no-delegates-focus class="set-focus"></no-delegates-focus>
        </>
      ),
    });
    function setFocus() {
      const elms = document.querySelectorAll('.set-focus');
      for (let i = 0; i < elms.length; i++) {
        (elms[i] as HTMLElement).focus();
      }
    }
  });

  it('should delegate focus', async () => {
    await $('delegates-focus.hydrated').waitForExist();
    await $('no-delegates-focus.hydrated').waitForExist();

    const delegatesFocus = document.querySelector('delegates-focus');
    const noDelegatesFocus = document.querySelector('no-delegates-focus');

    const delegateFocusStyles1 = window.getComputedStyle(delegatesFocus);
    expect(delegateFocusStyles1.borderColor).toBe('rgb(255, 0, 0)');

    const noDelegateFocusStyles1 = window.getComputedStyle(noDelegatesFocus);
    expect(noDelegateFocusStyles1.borderColor).toBe('rgb(255, 0, 0)');

    await $('button').click();

    const delegateFocusStyles2 = window.getComputedStyle(delegatesFocus);
    expect(delegateFocusStyles2.borderColor).toBe('rgb(0, 0, 255)');

    const noDelegateFocusStyles2 = window.getComputedStyle(noDelegatesFocus);
    expect(noDelegateFocusStyles2.borderColor).toBe('rgb(255, 0, 0)');
  });
});
