import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-conditional', () => {
  beforeEach(() => {
    function toggleHelloMessage() {
      const scopedConditional = document.querySelector('scoped-conditional');
      scopedConditional.renderHello = !scopedConditional.renderHello;
    }

    render({
      template: () => (
        <>
          <button id="toggleHello">Toggle Hello Message</button>
          <scoped-conditional>
            <div>This div will be slotted in</div>
          </scoped-conditional>
        </>
      ),
    });

    const button: HTMLButtonElement = document.querySelector('#toggleHello');
    button.onclick = toggleHelloMessage;
  });

  it('renders the initial slotted content', async () => {
    await $('scoped-conditional').waitForStable();
    await expect($('scoped-conditional div')).toHaveText(
      `before slot->
This div will be slotted in
<-after slot`,
    );
  });

  it('renders the slotted content after toggling the message', async () => {
    // toggle the 'Hello' message, which should insert a new <div/> into the DOM & _not_ remove the slotted content
    await $('#toggleHello').click();
    await $('scoped-conditional').waitForStable();

    const host = document.body.querySelector('scoped-conditional');
    const outerDivChildren = host.querySelector('div').childNodes;
    expect(outerDivChildren.length).toBe(2);
    expect(outerDivChildren[0].textContent).toBe('Hello');
    expect(outerDivChildren[1].textContent).toBe(`before slot->This div will be slotted in<-after slot`);
  });

  it('renders the slotted content after toggling the twice message', async () => {
    // toggle the 'Hello' message twice, which should insert a new <div/> into the DOM, then remove it.
    // as a result of the toggle, we should _not_ remove the slotted content
    await $('#toggleHello').click();
    await $('#toggleHello').click();

    await $('scoped-conditional').waitForStable();

    await expect($('scoped-conditional div')).toHaveText(
      `before slot->
This div will be slotted in
<-after slot`,
    );
  });
});
