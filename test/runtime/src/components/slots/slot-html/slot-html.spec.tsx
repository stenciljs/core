import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-html', () => {
  it('renders', async () => {
    await render(
      <div>
        <slot-html class="results1"></slot-html>

        <slot-html class="results2">default slot text node</slot-html>

        <slot-html class="results3">
          <content-default>default slot element 1</content-default>
          <content-default>default slot element 2</content-default>
          <content-default>default slot element 3</content-default>
        </slot-html>

        <slot-html class="results4">
          <content-default>default slot</content-default>
          <content-start slot="start">start slot 1</content-start>
          <content-start slot="start">start slot 2</content-start>
        </slot-html>

        <slot-html class="results5">
          <content-start slot="start">start slot 1</content-start>
          <content-start slot="start">start slot 2</content-start>
          default text node
        </slot-html>

        <slot-html class="results6">
          <content-start slot="start">start slot 1</content-start>
          <content-default>default slot 1</content-default>
          <content-start slot="start">start slot 2</content-start>
          <content-default>default slot 2</content-default>
        </slot-html>

        <slot-html class="results7">
          <content-default>default slot 1</content-default>
          <content-start slot="start">start slot 1</content-start>
          <content-start slot="start">start slot 2</content-start>
          <content-default>default slot 2</content-default>
        </slot-html>

        <slot-html class="results8">
          <content-end slot="end">end slot 1</content-end>
          <content-end slot="end">end slot 2</content-end>
        </slot-html>

        <slot-html class="results9">
          <content-default>default slot 1</content-default>
          <content-end slot="end">end slot 1</content-end>
          <content-end slot="end">end slot 2</content-end>
          <content-default>default slot 2</content-default>
        </slot-html>

        <slot-html class="results10">
          <content-default>default slot 1</content-default>
          <content-default>default slot 2</content-default>
          <content-end slot="end">end slot 1</content-end>
          default slot text node
          <content-end slot="end">end slot 2</content-end>
        </slot-html>

        <slot-html class="results11">
          <content-default>default slot 1</content-default>
          <content-end slot="end">end slot 1</content-end>
          <content-start slot="start">start slot 1</content-start>
          <content-end slot="end">end slot 2</content-end>
          <content-default>default slot 2</content-default>
          <content-start slot="start">start slot 2</content-start>
          default slot text node
        </slot-html>

        <slot-html class="results12">
          default slot text node
          <content-end slot="end">end slot 1</content-end>
          <content-start slot="start">start slot 1</content-start>
          <content-end slot="end">end slot 2</content-end>
          <content-default>default slot 1</content-default>
          <content-default>default slot 2</content-default>
          <content-start slot="start">start slot 2</content-start>
        </slot-html>
      </div>,
    );

    await waitForExist('.results1.hydrated');
    await waitForExist('.results12.hydrated');
    
    expect(document.querySelector('.results1')!.textContent).toBe('');

    const results2 = document.querySelector('.results2 div')!;
    expect(results2.textContent).toBe('default slot text node');

    const results3DefaultSlotChildren = document.querySelectorAll('.results3 div content-default');
    expect(results3DefaultSlotChildren.length).toBe(3);
    expect(results3DefaultSlotChildren[0].textContent).toBe('default slot element 1');
    expect(results3DefaultSlotChildren[1].textContent).toBe('default slot element 2');
    expect(results3DefaultSlotChildren[2].textContent).toBe('default slot element 3');

    const results4SlotStartChildren = document.querySelectorAll('.results4 div article span content-start');
    expect(results4SlotStartChildren[0].textContent).toBe('start slot 1');
    expect(results4SlotStartChildren[1].textContent).toBe('start slot 2');

    expect(document.querySelector('.results4 div content-default')!.textContent).toBe('default slot');

    const results5SlotStartChildren = document.querySelectorAll('.results5 div article span content-start');
    expect(results5SlotStartChildren[0].textContent).toBe('start slot 1');
    expect(results5SlotStartChildren[1].textContent).toBe('start slot 2');

    expect(document.querySelector('.results5 div')!.childNodes[3].textContent!.trim()).toBe('default text node');

    const results6SlotStartChildren = document.querySelectorAll('.results6 div article span content-start');
    expect(results6SlotStartChildren[0].textContent).toBe('start slot 1');
    expect(results6SlotStartChildren[1].textContent).toBe('start slot 2');

    const results6DefaultSlotChildren = document.querySelectorAll('.results6 div content-default');
    expect(results6DefaultSlotChildren[0].textContent).toBe('default slot 1');
    expect(results6DefaultSlotChildren[1].textContent).toBe('default slot 2');

    const results7SlotStartChildren = document.querySelectorAll('.results7 div article span content-start');
    expect(results7SlotStartChildren[0].textContent).toBe('start slot 1');
    expect(results7SlotStartChildren[1].textContent).toBe('start slot 2');

    const results7DefaultSlotChildren = document.querySelectorAll('.results7 div content-default');
    expect(results7DefaultSlotChildren[0].textContent).toBe('default slot 1');
    expect(results7DefaultSlotChildren[1].textContent).toBe('default slot 2');

    const results8SlotEndChildren = document.querySelectorAll('.results8 div section content-end');
    expect(results8SlotEndChildren[0].textContent).toBe('end slot 1');
    expect(results8SlotEndChildren[1].textContent).toBe('end slot 2');

    const results9SlotEndChildren = document.querySelectorAll('.results9 div section content-end');
    expect(results9SlotEndChildren[0].textContent).toBe('end slot 1');
    expect(results9SlotEndChildren[1].textContent).toBe('end slot 2');

    const results9DefaultSlotChildren = document.querySelectorAll('.results9 div content-default');
    expect(results9DefaultSlotChildren[0].textContent).toBe('default slot 1');
    expect(results9DefaultSlotChildren[1].textContent).toBe('default slot 2');

    const results10Children = document.querySelector('.results10 div')!.childNodes;
    expect(results10Children[3].textContent!.trim()).toBe('default slot 1');
    expect(results10Children[4].textContent!.trim()).toBe('default slot 2');
    expect(results10Children[5].textContent!.trim()).toBe('default slot text node');

    const results11 = document.querySelector('.results11 div')!;
    expect(results11.childNodes[1].childNodes[0].childNodes[1].textContent!.trim()).toBe('start slot 1');
    expect(results11.childNodes[1].childNodes[0].childNodes[2].textContent!.trim()).toBe('start slot 2');
    expect(results11.childNodes[3].textContent!.trim()).toBe('default slot 1');
    expect(results11.childNodes[4].textContent!.trim()).toBe('default slot 2');
    expect(results11.childNodes[5].textContent!.trim()).toBe('default slot text node');
    expect(results11.childNodes[6].childNodes[1].textContent!.trim()).toBe('end slot 1');
    expect(results11.childNodes[6].childNodes[2].textContent!.trim()).toBe('end slot 2');

    const results12 = document.querySelector('.results12 div')!;
    expect(results12.childNodes[1].childNodes[0].childNodes[1].textContent!.trim()).toBe('start slot 1');
    expect(results12.childNodes[1].childNodes[0].childNodes[2].textContent!.trim()).toBe('start slot 2');
    expect(results12.childNodes[3].textContent!.trim()).toBe('default slot text node');
    expect(results12.childNodes[4].textContent!.trim()).toBe('default slot 1');
    expect(results12.childNodes[5].textContent!.trim()).toBe('default slot 2');
    expect(results12.childNodes[6].childNodes[1].textContent!.trim()).toBe('end slot 1');
    expect(results12.childNodes[6].childNodes[2].textContent!.trim()).toBe('end slot 2');

    expect(document.querySelector('[hidden]')).toBeNull();
  });
});
