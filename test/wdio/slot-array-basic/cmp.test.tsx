import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot array basic', () => {
  const style = `slot-array-basic {
    display: block;
    margin: 10px;
    border: 2px solid black;
  }
  content-top {
    display: block;
    background: red;
    color: white;
    padding: 10px;
  }
  content-middle {
    display: block;
    background: purple;
    color: white;
    padding: 10px;
  }
  content-bottom {
    display: block;
    background: blue;
    color: white;
    padding: 10px;
  }`;

  beforeEach(() => {
    render({
      template: () => (
        <>
          <style>{style}</style>

          <slot-array-basic class="results1"></slot-array-basic>

          <slot-array-basic class="results2">
            <content-top>Content</content-top>
          </slot-array-basic>

          <slot-array-basic class="results3">
            <content-top>Content Top</content-top>
            <content-bottom>Content Bottom</content-bottom>
          </slot-array-basic>

          <slot-array-basic class="results4">
            <content-top>Content Top</content-top>
            <content-middle>Content Middle</content-middle>
            <content-bottom>Content Bottom</content-bottom>
          </slot-array-basic>
        </>
      ),
    });
  });

  it('renders slotted content between header/footer', async () => {
    await $('slot-array-basic').waitForExist();

    let children = $$('.results1 > *');
    await expect(children).toBeElementsArrayOfSize(2);
    await expect(await children[0].getTagName()).toBe('header');
    await expect(children[0]).toHaveText('Header');
    await expect(await children[1].getTagName()).toBe('footer');
    await expect(children[1]).toHaveText('Footer');

    children = $$('.results2 > *');
    await expect(children).toBeElementsArrayOfSize(3);
    await expect(await children[0].getTagName()).toBe('header');
    await expect(children[0]).toHaveText('Header');
    await expect(await children[1].getTagName()).toBe('content-top');
    await expect(children[1]).toHaveText('Content');
    await expect(await children[2].getTagName()).toBe('footer');
    await expect(children[2]).toHaveText('Footer');

    children = $$('.results3 > *');
    await expect(children).toBeElementsArrayOfSize(4);
    await expect(await children[0].getTagName()).toBe('header');
    await expect(children[0]).toHaveText('Header');
    await expect(await children[1].getTagName()).toBe('content-top');
    await expect(children[1]).toHaveText('Content Top');
    await expect(await children[2].getTagName()).toBe('content-bottom');
    await expect(children[2]).toHaveText('Content Bottom');
    await expect(await children[3].getTagName()).toBe('footer');
    await expect(children[3]).toHaveText('Footer');

    children = $$('.results4 > *');
    await expect(children).toBeElementsArrayOfSize(5);
    await expect(await children[0].getTagName()).toBe('header');
    await expect(children[0]).toHaveText('Header');
    await expect(await children[1].getTagName()).toBe('content-top');
    await expect(children[1]).toHaveText('Content Top');
    await expect(await children[2].getTagName()).toBe('content-middle');
    await expect(children[2]).toHaveText('Content Middle');
    await expect(await children[3].getTagName()).toBe('content-bottom');
    await expect(children[3]).toHaveText('Content Bottom');
    await expect(await children[4].getTagName()).toBe('footer');
    await expect(children[4]).toHaveText('Footer');

    await expect($('[hidden]')).not.toBeExisting();
  });
});
