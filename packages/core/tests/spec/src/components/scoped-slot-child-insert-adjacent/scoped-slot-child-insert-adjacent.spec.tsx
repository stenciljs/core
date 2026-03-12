import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-slot-child-insert-adjacent', () => {
  describe('insertAdjacentHtml', () => {
    it('slots elements w/ "beforeend" position', async () => {
      await render(
        <scoped-slot-child-insert-adjacent>
          <p>I am slotted and will receive a red background</p>
        </scoped-slot-child-insert-adjacent>,
      );

      const host = document.querySelector('scoped-slot-child-insert-adjacent')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(parentDiv).toBeDefined();

      // before we hit the button to call `insertAdjacentHTML`, we should only have one <p> elm
      let paragraphElms = host.querySelectorAll('p');
      const firstParagraph = paragraphElms[0];
      expect(firstParagraph.textContent).toBe('I am slotted and will receive a red background');
      expect(firstParagraph.parentElement).toBe(parentDiv);
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');

      // insert an additional <p> elm
      host.insertAdjacentHTML('beforeend', `<p>Added via insertAdjacentHTMLBeforeEnd. I should have a red background.</p>`);

      // now we should have 2 <p> elms
      paragraphElms = host.querySelectorAll('p');
      expect(paragraphElms.length).toBe(2);

      // the inserted elm should:
      // 1. have the <div> as it's parent
      // 2. the <div> should have the same style (which gets acquired by both <p> elms)
      const secondParagraph = paragraphElms[1];
      expect(secondParagraph.textContent).toBe('Added via insertAdjacentHTMLBeforeEnd. I should have a red background.');
      expect(secondParagraph.parentElement).toBe(parentDiv);
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('slots elements w/ "afterbegin" position', async () => {
      await render(
        <scoped-slot-child-insert-adjacent>
          <p>I am slotted and will receive a red background</p>
        </scoped-slot-child-insert-adjacent>,
      );

      const host = document.querySelector('scoped-slot-child-insert-adjacent')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(parentDiv).toBeDefined();

      // before we hit the button to call `insertAdjacentHTML`, we should only have one <p> elm
      let paragraphElms = host.querySelectorAll('p');
      const firstParagraph = paragraphElms[0];
      expect(firstParagraph.textContent).toBe('I am slotted and will receive a red background');
      expect(firstParagraph.parentElement).toBe(parentDiv);
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');

      // insert an additional <p> elm
      host.insertAdjacentHTML('afterbegin', `<p>Added via insertAdjacentHTMLAfterBegin. I should have a red background.</p>`);

      // now we should have 2 <p> elms
      paragraphElms = host.querySelectorAll('p');
      expect(paragraphElms.length).toBe(2);

      // the inserted elm should:
      // 1. have the <div> as it's parent
      // 2. the <div> should have the same style (which gets acquired by both <p> elms)
      const insertedParagraph = paragraphElms[0];
      expect(insertedParagraph.textContent).toBe('Added via insertAdjacentHTMLAfterBegin. I should have a red background.');
      expect(insertedParagraph.parentElement).toBe(parentDiv);
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('insertAdjacentText', () => {
    it('slots elements w/ "beforeend" position', async () => {
      await render(
        <scoped-slot-child-insert-adjacent>
          <p>I am slotted and will receive a red background</p>
        </scoped-slot-child-insert-adjacent>,
      );

      const host = document.querySelector('scoped-slot-child-insert-adjacent')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(parentDiv).toBeDefined();
      expect(parentDiv.textContent).toBe('Here is my slot. It is red.I am slotted and will receive a red background');
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');

      // insert an additional text node
      host.insertAdjacentText('beforeend', `Added via insertAdjacentTextBeforeEnd. I should have a red background.`);

      expect(parentDiv.textContent).toBe(
        'Here is my slot. It is red.I am slotted and will receive a red backgroundAdded via insertAdjacentTextBeforeEnd. I should have a red background.',
      );
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('slots elements w/ "afterbegin" position', async () => {
      await render(
        <scoped-slot-child-insert-adjacent>
          <p>I am slotted and will receive a red background</p>
        </scoped-slot-child-insert-adjacent>,
      );

      const host = document.querySelector('scoped-slot-child-insert-adjacent')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(parentDiv).toBeDefined();
      expect(parentDiv.textContent).toBe('Here is my slot. It is red.I am slotted and will receive a red background');
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');

      // insert an additional text node
      host.insertAdjacentText('afterbegin', `Added via insertAdjacentTextAfterBegin. I should have a red background.`);

      expect(parentDiv.textContent).toBe(
        'Here is my slot. It is red.Added via insertAdjacentTextAfterBegin. I should have a red background.I am slotted and will receive a red background',
      );
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('insertAdjacentElement', () => {
    it('slots elements w/ "beforeend" position', async () => {
      await render(
        <scoped-slot-child-insert-adjacent>
          <p>I am slotted and will receive a red background</p>
        </scoped-slot-child-insert-adjacent>,
      );

      const host = document.querySelector('scoped-slot-child-insert-adjacent')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(parentDiv).toBeDefined();

      let children = parentDiv.children;
      expect(children.length).toBe(1);
      expect(children[0].textContent).toBe('I am slotted and will receive a red background');
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');

      const el = document.createElement('span');
      el.textContent = 'Added via insertAdjacentElementBeforeEnd. I should have a red background.';
      host.insertAdjacentElement('beforeend', el);

      children = parentDiv.children;
      expect(children.length).toBe(2);
      expect(children[1].textContent).toBe('Added via insertAdjacentElementBeforeEnd. I should have a red background.');
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('slots elements w/ "afterbegin" position', async () => {
      await render(
        <scoped-slot-child-insert-adjacent>
          <p>I am slotted and will receive a red background</p>
        </scoped-slot-child-insert-adjacent>,
      );

      const host = document.querySelector('scoped-slot-child-insert-adjacent')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(parentDiv).toBeDefined();

      let children = parentDiv.children;
      expect(children.length).toBe(1);
      expect(children[0].textContent).toBe('I am slotted and will receive a red background');
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');

      const el = document.createElement('span');
      el.textContent = 'Added via insertAdjacentElementAfterBegin. I should have a red background.';
      host.insertAdjacentElement('afterbegin', el);

      children = parentDiv.children;
      expect(children.length).toBe(2);
      expect(children[0].textContent).toBe('Added via insertAdjacentElementAfterBegin. I should have a red background.');
      expect(getComputedStyle(parentDiv).backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });
});
