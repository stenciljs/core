import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-child-insert-adjacent', () => {
  let host: HTMLElement | undefined;
  let parentDiv: HTMLDivElement | undefined;

  beforeEach(async () => {
    render({
      template: () => (
        <>
          <scoped-slot-child-insert-adjacent>
            <p>I am slotted and will receive a red background</p>
          </scoped-slot-child-insert-adjacent>

          <button type="button" id="addInsertAdjacentHtmlBeforeEnd">
            add via insertAdjacentHTML (beforeend)
          </button>
          <button type="button" id="addInsertAdjacentHtmlAfterBegin">
            add via insertAdjacentHTML (afterbegin)
          </button>

          <button type="button" id="addInsertAdjacentTextBeforeEnd">
            add via insertAdjacentText (beforeend)
          </button>
          <button type="button" id="addInsertAdjacentTextAfterBegin">
            add via insertAdjacentText (afterbegin)
          </button>

          <button type="button" id="addInsertAdjacentElementBeforeEnd">
            add via insertAdjacentElement (beforeend)
          </button>
          <button type="button" id="addInsertAdjacentElementAfterBegin">
            add via insertAdjacentElement (afterbegin)
          </button>
        </>
      ),
    });

    await $('scoped-slot-child-insert-adjacent').waitForExist();
    const scopedSlotChildInsertAdjacent = document.querySelector('scoped-slot-child-insert-adjacent');

    // Event listeners for `insertAdjacentHtml`
    await $('#addInsertAdjacentHtmlBeforeEnd').waitForExist();
    const addInsertAdjacentHtmlBeforeEnd = document.querySelector('#addInsertAdjacentHtmlBeforeEnd');
    addInsertAdjacentHtmlBeforeEnd.addEventListener('click', () => {
      scopedSlotChildInsertAdjacent.insertAdjacentHTML(
        'beforeend',
        `<p>Added via insertAdjacentHTMLBeforeEnd. I should have a red background.</p>`,
      );
    });
    const addInsertAdjacentHtmlAfterBegin = document.querySelector('#addInsertAdjacentHtmlAfterBegin');
    addInsertAdjacentHtmlAfterBegin.addEventListener('click', () => {
      scopedSlotChildInsertAdjacent.insertAdjacentHTML(
        'afterbegin',
        `<p>Added via insertAdjacentHTMLAfterBegin. I should have a red background.</p>`,
      );
    });

    // Event listeners for `insertAdjacentText`
    const addInsertAdjacentTextBeforeEnd = document.querySelector('#addInsertAdjacentTextBeforeEnd');
    addInsertAdjacentTextBeforeEnd.addEventListener('click', () => {
      scopedSlotChildInsertAdjacent.insertAdjacentText(
        'beforeend',
        `Added via insertAdjacentTextBeforeEnd. I should have a red background.`,
      );
    });
    const addInsertAdjacentTextAfterBegin = document.querySelector('#addInsertAdjacentTextAfterBegin');
    addInsertAdjacentTextAfterBegin.addEventListener('click', () => {
      scopedSlotChildInsertAdjacent.insertAdjacentText(
        'afterbegin',
        `Added via insertAdjacentTextAfterBegin. I should have a red background.`,
      );
    });

    // Event listeners for `insertAdjacentElement`
    const addInsertAdjacentElementBeforeEnd = document.querySelector('#addInsertAdjacentElementBeforeEnd');
    addInsertAdjacentElementBeforeEnd.addEventListener('click', () => {
      const el = document.createElement('span');
      el.textContent = 'Added via insertAdjacentElementBeforeEnd. I should have a red background.';

      scopedSlotChildInsertAdjacent.insertAdjacentElement('beforeend', el);
    });
    const addInsertAdjacentElementAfterBegin = document.querySelector('#addInsertAdjacentElementAfterBegin');
    addInsertAdjacentElementAfterBegin.addEventListener('click', () => {
      const el = document.createElement('span');
      el.textContent = 'Added via insertAdjacentElementAfterBegin. I should have a red background.';

      scopedSlotChildInsertAdjacent.insertAdjacentElement('afterbegin', el);
    });

    host = document.querySelector('scoped-slot-child-insert-adjacent');
    parentDiv = host.querySelector('#parentDiv');
  });

  describe('insertAdjacentHtml', () => {
    it('slots elements w/ "beforeend" position', async () => {
      expect(parentDiv).toBeDefined();

      // before we hit the button to call `insertAdjacentHTML`, we should only have one <p> elm
      let paragraphElms = host.querySelectorAll('p');
      const firstParagraph = paragraphElms[0];
      expect(firstParagraph.textContent).toBe('I am slotted and will receive a red background');
      expect(firstParagraph.parentElement).toBe(parentDiv);
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');

      // insert an additional <p> elm
      const addButton = $('#addInsertAdjacentHtmlBeforeEnd');
      await addButton.click();

      // now we should have 2 <p> elms
      paragraphElms = host.querySelectorAll('p');
      expect(paragraphElms.length).toBe(2);

      // the inserted elm should:
      // 1. have the <div> as it's parent
      // 2. the <div> should have the same style (which gets acquired by both <p> elms)
      const secondParagraph = paragraphElms[1];
      expect(secondParagraph.textContent).toBe(
        'Added via insertAdjacentHTMLBeforeEnd. I should have a red background.',
      );
      expect(secondParagraph.parentElement).toBe(parentDiv);
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');
    });

    it('slots elements w/ "afterbegin" position', async () => {
      expect(parentDiv).toBeDefined();

      // before we hit the button to call `insertAdjacentHTML`, we should only have one <p> elm
      let paragraphElms = host.querySelectorAll('p');
      const firstParagraph = paragraphElms[0];
      expect(firstParagraph.textContent).toBe('I am slotted and will receive a red background');
      expect(firstParagraph.parentElement).toBe(parentDiv);
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');

      // insert an additional <p> elm
      const addButton = $('#addInsertAdjacentHtmlAfterBegin');
      await addButton.click();

      // now we should have 2 <p> elms
      paragraphElms = host.querySelectorAll('p');
      expect(paragraphElms.length).toBe(2);

      // the inserted elm should:
      // 1. have the <div> as it's parent
      // 2. the <div> should have the same style (which gets acquired by both <p> elms)
      const insertedParagraph = paragraphElms[0];
      expect(insertedParagraph.textContent).toBe(
        'Added via insertAdjacentHTMLAfterBegin. I should have a red background.',
      );
      expect(insertedParagraph.parentElement).toBe(parentDiv);
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');
    });
  });

  describe('insertAdjacentText', () => {
    it('slots elements w/ "beforeend" position', async () => {
      expect(parentDiv).toBeDefined();

      expect(parentDiv.textContent).toBe('Here is my slot. It is red.I am slotted and will receive a red background');
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');

      // insert an additional text node
      const addButton = $('#addInsertAdjacentTextBeforeEnd');
      await addButton.click();

      expect(parentDiv.textContent).toBe(
        'Here is my slot. It is red.I am slotted and will receive a red backgroundAdded via insertAdjacentTextBeforeEnd. I should have a red background.',
      );
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');
    });

    it('slots elements w/ "afterbegin" position', async () => {
      expect(parentDiv).toBeDefined();

      expect(parentDiv.textContent).toBe('Here is my slot. It is red.I am slotted and will receive a red background');
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');

      // insert an additional text node
      const addButton = $('#addInsertAdjacentTextAfterBegin');
      await addButton.click();

      expect(parentDiv.textContent).toBe(
        'Here is my slot. It is red.Added via insertAdjacentTextAfterBegin. I should have a red background.I am slotted and will receive a red background',
      );
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');
    });
  });

  describe('insertAdjacentElement', () => {
    it('slots elements w/ "beforeend" position', async () => {
      expect(parentDiv).toBeDefined();

      let children = parentDiv.children;
      expect(children.length).toBe(1);
      expect(children[0].textContent).toBe('I am slotted and will receive a red background');
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');

      const addButton = $('#addInsertAdjacentElementBeforeEnd');
      await addButton.click();

      children = parentDiv.children;
      expect(children.length).toBe(2);
      expect(children[1].textContent).toBe('Added via insertAdjacentElementBeforeEnd. I should have a red background.');
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');
    });

    it('slots elements w/ "afterBegin" position', async () => {
      expect(parentDiv).toBeDefined();

      let children = parentDiv.children;
      expect(children.length).toBe(1);
      expect(children[0].textContent).toBe('I am slotted and will receive a red background');
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');

      const addButton = $('#addInsertAdjacentElementAfterBegin');
      await addButton.click();

      children = parentDiv.children;
      expect(children.length).toBe(2);
      expect(children[0].textContent).toBe(
        'Added via insertAdjacentElementAfterBegin. I should have a red background.',
      );
      expect((getComputedStyle(parentDiv) as any)['background-color']).toBe('rgb(255, 0, 0)');
    });
  });
});
