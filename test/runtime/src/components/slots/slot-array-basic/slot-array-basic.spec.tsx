import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot array basic', () => {
  it('renders slotted content between header/footer', async () => {
    await render(
      <div>
        <slot-array-basic class='results1'></slot-array-basic>

        <slot-array-basic class='results2'>
          <content-top>Content</content-top>
        </slot-array-basic>

        <slot-array-basic class='results3'>
          <content-top>Content Top</content-top>
          <content-bottom>Content Bottom</content-bottom>
        </slot-array-basic>

        <slot-array-basic class='results4'>
          <content-top>Content Top</content-top>
          <content-middle>Content Middle</content-middle>
          <content-bottom>Content Bottom</content-bottom>
        </slot-array-basic>
      </div>,
      { waitForReady: false },
    );

    await waitForExist('.results1.hydrated');

    // <slot> is now a real DOM element — direct children are header, slot, footer
    let children = document.querySelectorAll('.results1 > *');
    expect(children.length).toBe(3);
    expect(children[0].tagName.toLowerCase()).toBe('header');
    expect(children[0].textContent).toBe('Header');
    expect(children[1].tagName.toLowerCase()).toBe('slot');
    expect(children[2].tagName.toLowerCase()).toBe('footer');
    expect(children[2].textContent).toBe('Footer');

    // slotted content lives inside <slot>
    children = document.querySelectorAll('.results2 > *');
    expect(children.length).toBe(3);
    expect(children[0].tagName.toLowerCase()).toBe('header');
    expect(children[1].tagName.toLowerCase()).toBe('slot');
    expect(children[1].children[0].tagName.toLowerCase()).toBe('content-top');
    expect(children[1].children[0].textContent).toBe('Content');
    expect(children[2].tagName.toLowerCase()).toBe('footer');

    children = document.querySelectorAll('.results3 > *');
    expect(children.length).toBe(3);
    expect(children[0].tagName.toLowerCase()).toBe('header');
    expect(children[1].tagName.toLowerCase()).toBe('slot');
    expect(children[1].children[0].tagName.toLowerCase()).toBe('content-top');
    expect(children[1].children[0].textContent).toBe('Content Top');
    expect(children[1].children[1].tagName.toLowerCase()).toBe('content-bottom');
    expect(children[1].children[1].textContent).toBe('Content Bottom');
    expect(children[2].tagName.toLowerCase()).toBe('footer');

    children = document.querySelectorAll('.results4 > *');
    expect(children.length).toBe(3);
    expect(children[0].tagName.toLowerCase()).toBe('header');
    expect(children[1].tagName.toLowerCase()).toBe('slot');
    expect(children[1].children[0].tagName.toLowerCase()).toBe('content-top');
    expect(children[1].children[0].textContent).toBe('Content Top');
    expect(children[1].children[1].tagName.toLowerCase()).toBe('content-middle');
    expect(children[1].children[1].textContent).toBe('Content Middle');
    expect(children[1].children[2].tagName.toLowerCase()).toBe('content-bottom');
    expect(children[1].children[2].textContent).toBe('Content Bottom');
    expect(children[2].tagName.toLowerCase()).toBe('footer');

    expect(document.querySelector('[hidden]')).toBeNull();
  });
});
