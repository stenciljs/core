import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, $$, expect } from '@wdio/globals';

describe('slot-html', () => {
  const style = `body {
  color: darkgray;
}
div article span {
  background: darkred;
  color: white;
}
div {
  background: darkgreen;
  color: white;
}
div section {
  background: darkblue;
  color: white;
}`;

  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <>
          <style>{style}</style>

          <slot-html className="results1"></slot-html>

          <slot-html className="results2">default slot text node</slot-html>

          <slot-html className="results3">
            <content-default>default slot element 1</content-default>
            <content-default>default slot element 2</content-default>
            <content-default>default slot element 3</content-default>
          </slot-html>

          <slot-html className="results4">
            <content-default>default slot</content-default>
            <content-start slot="start">start slot 1</content-start>
            <content-start slot="start">start slot 2</content-start>
          </slot-html>

          <slot-html className="results5">
            <content-start slot="start">start slot 1</content-start>
            <content-start slot="start">start slot 2</content-start>
            default text node
          </slot-html>

          <slot-html className="results6">
            <content-start slot="start">start slot 1</content-start>
            <content-default>default slot 1</content-default>
            <content-start slot="start">start slot 2</content-start>
            <content-default>default slot 2</content-default>
          </slot-html>

          <slot-html className="results7">
            <content-default>default slot 1</content-default>
            <content-start slot="start">start slot 1</content-start>
            <content-start slot="start">start slot 2</content-start>
            <content-default>default slot 2</content-default>
          </slot-html>

          <slot-html className="results8">
            <content-end slot="end">end slot 1</content-end>
            <content-end slot="end">end slot 2</content-end>
          </slot-html>

          <slot-html className="results9">
            <content-default>default slot 1</content-default>
            <content-end slot="end">end slot 1</content-end>
            <content-end slot="end">end slot 2</content-end>
            <content-default>default slot 2</content-default>
          </slot-html>

          <slot-html className="results10">
            <content-default>default slot 1</content-default>
            <content-default>default slot 2</content-default>
            <content-end slot="end">end slot 1</content-end>
            default slot text node
            <content-end slot="end">end slot 2</content-end>
          </slot-html>

          <slot-html className="results11">
            <content-default>default slot 1</content-default>
            <content-end slot="end">end slot 1</content-end>
            <content-start slot="start">start slot 1</content-start>
            <content-end slot="end">end slot 2</content-end>
            <content-default>default slot 2</content-default>
            <content-start slot="start">start slot 2</content-start>
            default slot text node
          </slot-html>

          <slot-html className="results12">
            default slot text node
            <content-end slot="end">end slot 1</content-end>
            <content-start slot="start">start slot 1</content-start>
            <content-end slot="end">end slot 2</content-end>
            <content-default>default slot 1</content-default>
            <content-default>default slot 2</content-default>
            <content-start slot="start">start slot 2</content-start>
          </slot-html>
        </>
      ),
    });
  });

  it('renders', async () => {
    await expect($('.results1')).toHaveText('');

    await $('.results2').waitForExist();
    const results2 = await $('.results2 div');
    await expect(results2).toHaveText('default slot text node');

    const results3DefaultSlotChildren = $$('.results3 div content-default');
    await expect(results3DefaultSlotChildren).toBeElementsArrayOfSize(3);

    await expect(results3DefaultSlotChildren[0]).toHaveText('default slot element 1');
    await expect(results3DefaultSlotChildren[1]).toHaveText('default slot element 2');
    await expect(results3DefaultSlotChildren[2]).toHaveText('default slot element 3');

    const results4SlotStartChildren = $$('.results4 div article span content-start');
    await expect(results4SlotStartChildren[0]).toHaveText('start slot 1');
    await expect(results4SlotStartChildren[1]).toHaveText('start slot 2');

    await expect($('.results4 div content-default')).toHaveText('default slot');

    const results5SlotStartChildren = $$('.results5 div article span content-start');
    await expect(results5SlotStartChildren[0]).toHaveText('start slot 1');
    await expect(results5SlotStartChildren[1]).toHaveText('start slot 2');

    expect(document.querySelector('.results5 div').childNodes[3].textContent.trim()).toBe('default text node');

    const results6SlotStartChildren = $$('.results6 div article span content-start');
    await expect(results6SlotStartChildren[0]).toHaveText('start slot 1');
    await expect(results6SlotStartChildren[1]).toHaveText('start slot 2');

    const results6DefaultSlotChildren = $$('.results6 div content-default');
    await expect(results6DefaultSlotChildren[0]).toHaveText('default slot 1');
    await expect(results6DefaultSlotChildren[1]).toHaveText('default slot 2');

    const results7SlotStartChildren = $$('.results7 div article span content-start');
    await expect(results7SlotStartChildren[0]).toHaveText('start slot 1');
    await expect(results7SlotStartChildren[1]).toHaveText('start slot 2');

    const results7DefaultSlotChildren = $$('.results7 div content-default');
    await expect(results7DefaultSlotChildren[0]).toHaveText('default slot 1');
    await expect(results7DefaultSlotChildren[1]).toHaveText('default slot 2');

    const results8SlotEndChildren = $$('.results8 div section content-end');
    await expect(results8SlotEndChildren[0]).toHaveText('end slot 1');
    await expect(results8SlotEndChildren[1]).toHaveText('end slot 2');

    const results9SlotEndChildren = $$('.results9 div section content-end');
    await expect(results9SlotEndChildren[0]).toHaveText('end slot 1');
    await expect(results9SlotEndChildren[1]).toHaveText('end slot 2');

    const results9DefaultSlotChildren = $$('.results9 div content-default');
    await expect(results9DefaultSlotChildren[0]).toHaveText('default slot 1');
    await expect(results9DefaultSlotChildren[1]).toHaveText('default slot 2');

    const results10Children = document.querySelector('.results10 div').childNodes;
    expect(results10Children[3].textContent.trim()).toBe('default slot 1');
    expect(results10Children[4].textContent.trim()).toBe('default slot 2');
    expect(results10Children[5].textContent.trim()).toBe('default slot text node');

    const results11 = document.querySelector('.results11 div');
    expect(results11.childNodes[1].childNodes[0].childNodes[1].textContent.trim()).toBe('start slot 1');
    expect(results11.childNodes[1].childNodes[0].childNodes[2].textContent.trim()).toBe('start slot 2');
    expect(results11.childNodes[3].textContent.trim()).toBe('default slot 1');
    expect(results11.childNodes[4].textContent.trim()).toBe('default slot 2');
    expect(results11.childNodes[5].textContent.trim()).toBe('default slot text node');
    expect(results11.childNodes[6].childNodes[1].textContent.trim()).toBe('end slot 1');
    expect(results11.childNodes[6].childNodes[2].textContent.trim()).toBe('end slot 2');

    const results12 = document.querySelector('.results12 div');
    expect(results12.childNodes[1].childNodes[0].childNodes[1].textContent.trim()).toBe('start slot 1');
    expect(results12.childNodes[1].childNodes[0].childNodes[2].textContent.trim()).toBe('start slot 2');
    expect(results12.childNodes[3].textContent.trim()).toBe('default slot text node');
    expect(results12.childNodes[4].textContent.trim()).toBe('default slot 1');
    expect(results12.childNodes[5].textContent.trim()).toBe('default slot 2');
    expect(results12.childNodes[6].childNodes[1].textContent.trim()).toBe('end slot 1');
    expect(results12.childNodes[6].childNodes[2].textContent.trim()).toBe('end slot 2');

    await expect($('[hidden]')).not.toBeExisting();
  });
});
