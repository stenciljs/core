import { Component, h, Host } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';

import { patchPseudoShadowDom, patchSlotPrepend, patchSlottedNode } from '../../runtime/dom-extras';

describe('dom-extras - patches for non-shadow dom methods and accessors', () => {
  let specPage: SpecPage;

  const nodeOrEleContent = (node: Node | Element) => {
    return (node as Element)?.outerHTML || node?.nodeValue?.trim();
  };

  beforeEach(async () => {
    @Component({
      tag: 'cmp-a',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <Host>
            'Shadow' first text node
            <article>
              <div>
                <slot name="second-slot">Second slot fallback text</slot>
              </div>
              <div>
                <slot>Default slot fallback text</slot>
              </div>
            </article>
            'Shadow' last text node
          </Host>
        );
      }
    }

    specPage = await newSpecPage({
      components: [CmpA],
      html: `
        <cmp-a>
          Some default slot, slotted text
          <span>a default slot, slotted element</span>
          <div slot="second-slot">
            a second slot, slotted element
            <span>nested element in the second slot<span>
          </div></cmp-a>
      `,
      hydrateClientSide: true,
    });

    patchPseudoShadowDom(specPage.root);
  });

  it('patches `childNodes` to return only nodes that have been slotted', async () => {
    const childNodes = specPage.root.childNodes;

    expect(nodeOrEleContent(childNodes[0])).toBe(`Some default slot, slotted text`);
    expect(nodeOrEleContent(childNodes[1])).toBe(`<span>a default slot, slotted element</span>`);
    expect(nodeOrEleContent(childNodes[2])).toBe(``);
    expect(nodeOrEleContent(childNodes[3])).toBe(
      `<div slot="second-slot"> a second slot, slotted element <span>nested element in the second slot<span></span></span></div>`,
    );

    const innerChildNodes = specPage.root.__childNodes;

    expect(nodeOrEleContent(innerChildNodes[0])).toBe(``);
    expect(nodeOrEleContent(innerChildNodes[1])).toBe(``);
    expect(nodeOrEleContent(innerChildNodes[2])).toBe(``);
    expect(nodeOrEleContent(innerChildNodes[3])).toBe(``);
    expect(nodeOrEleContent(innerChildNodes[4])).toBe(``);
    expect(nodeOrEleContent(innerChildNodes[5])).toBe(`'Shadow' first text node`);
  });

  it('patches `children` to return only elements that have been slotted', async () => {
    const children = specPage.root.children;

    expect(nodeOrEleContent(children[0])).toBe(`<span>a default slot, slotted element</span>`);
    expect(nodeOrEleContent(children[1])).toBe(
      `<div slot="second-slot"> a second slot, slotted element <span>nested element in the second slot<span></span></span></div>`,
    );
    expect(nodeOrEleContent(children[2])).toBe(undefined);
  });

  it('patches `childElementCount` to only count elements that have been slotted', async () => {
    expect(specPage.root.childElementCount).toBe(2);
  });

  it('patches `textContent` to only return slotted node text', async () => {
    expect(specPage.root.textContent.replace(/\s+/g, ' ').trim()).toBe(
      `Some default slot, slotted text a default slot, slotted element a second slot, slotted element nested element in the second slot`,
    );
  });

  // slot placement for `textContent` and the `afterbegin` / `beforeend` positions is covered in
  // test/wdio/text-content-patch and test/wdio/scoped-slot-child-insert-adjacent
  describe('insertAdjacentText inserts text, never HTML', () => {
    const markup = '<img src="x" onerror="window.__xss = true"><b>bold</b>';

    it.each(['beforebegin', 'afterend'] as const)(
      'inserts `insertAdjacentText` %s content as text outside the host',
      async (position) => {
        specPage.root.insertAdjacentText(position, markup);

        const parent = specPage.root.parentNode as Element;
        expect(parent.querySelector('img')).toBeNull();
        expect(parent.querySelector('b')).toBeNull();

        const sibling = position === 'beforebegin' ? specPage.root.previousSibling : specPage.root.nextSibling;
        expect(sibling.nodeType).toBe(3);
        expect(sibling.nodeValue).toBe(markup);
      },
    );

    it.each(['afterbegin', 'beforeend'] as const)(
      'inserts `insertAdjacentText` %s content as text inside the host',
      async (position) => {
        specPage.root.insertAdjacentText(position, markup);

        expect(specPage.root.querySelector('img')).toBeNull();
        expect(specPage.root.querySelector('b')).toBeNull();
        expect(specPage.root.outerHTML).toContain('&lt;img src="x"');
      },
    );
  });

  describe('on a host with no light DOM', () => {
    const markup = '<img src="x" onerror="window.__xss = true"><b>bold</b>';
    let emptyPage: SpecPage;

    beforeEach(async () => {
      @Component({
        tag: 'cmp-b',
        scoped: true,
      })
      class CmpB {
        render() {
          return (
            <div>
              <slot />
            </div>
          );
        }
      }

      emptyPage = await newSpecPage({
        components: [CmpB],
        html: `<cmp-b></cmp-b>`,
      });
    });

    it('patches the `textContent` setter to insert text, never HTML', async () => {
      patchPseudoShadowDom(emptyPage.root);
      emptyPage.root.textContent = markup;

      expect(emptyPage.root.querySelector('img')).toBeNull();
      expect(emptyPage.root.querySelector('b')).toBeNull();
      // serialized as escaped text, not as an <img> element
      expect(emptyPage.root.outerHTML).toContain('&lt;img src="x"');
      expect(emptyPage.root.outerHTML).not.toContain('<img');
    });

    it('clears slotted content when `textContent` is set to null or an empty string', async () => {
      patchPseudoShadowDom(emptyPage.root);

      emptyPage.root.textContent = 'some text';
      emptyPage.root.textContent = null;
      expect(emptyPage.root.childNodes.length).toBe(0);

      emptyPage.root.textContent = 'some text';
      emptyPage.root.textContent = '';
      expect(emptyPage.root.childNodes.length).toBe(0);
    });

    it('calls the original `prepend` on the host when no slot matches', async () => {
      // patch a prototype rather than the instance, like the runtime does
      const host = emptyPage.root;
      const proto = Object.create(Object.getPrototypeOf(host));
      patchSlotPrepend(proto);
      Object.setPrototypeOf(host, proto);

      const elm = emptyPage.doc.createElement('span');
      elm.setAttribute('slot', 'no-such-slot');

      expect(() => host.prepend(elm)).not.toThrow();
      expect(elm.parentNode).toBe(host);
      expect(host.firstChild).toBe(elm);
    });
  });

  it('firstChild', async () => {
    expect(nodeOrEleContent(specPage.root.firstChild)).toBe(`Some default slot, slotted text`);
  });

  it('lastChild', async () => {
    expect(nodeOrEleContent(specPage.root.lastChild)).toBe(
      `<div slot=\"second-slot\"> a second slot, slotted element <span>nested element in the second slot<span></span></span></div>`,
    );
  });

  it('patches nextSibling / previousSibling accessors of slotted nodes', async () => {
    specPage.root.childNodes.forEach((node: Node) => patchSlottedNode(node));
    expect(nodeOrEleContent(specPage.root.firstChild)).toBe('Some default slot, slotted text');
    expect(nodeOrEleContent(specPage.root.firstChild.nextSibling)).toBe('<span>a default slot, slotted element</span>');
    expect(nodeOrEleContent(specPage.root.firstChild.nextSibling.nextSibling)).toBe(``);
    expect(nodeOrEleContent(specPage.root.firstChild.nextSibling.nextSibling.nextSibling)).toBe(
      `<div slot=\"second-slot\"> a second slot, slotted element <span>nested element in the second slot<span></span></span></div>`,
    );
    // back we go!
    expect(nodeOrEleContent(specPage.root.firstChild.nextSibling.nextSibling.nextSibling.previousSibling)).toBe(``);
    expect(
      nodeOrEleContent(specPage.root.firstChild.nextSibling.nextSibling.nextSibling.previousSibling.previousSibling),
    ).toBe(`<span>a default slot, slotted element</span>`);
    expect(
      nodeOrEleContent(
        specPage.root.firstChild.nextSibling.nextSibling.nextSibling.previousSibling.previousSibling.previousSibling,
      ),
    ).toBe(`Some default slot, slotted text`);
  });

  it('patches nextElementSibling / previousElementSibling accessors of slotted nodes', async () => {
    specPage.root.childNodes.forEach((node: Node) => patchSlottedNode(node));
    expect(nodeOrEleContent(specPage.root.children[0].nextElementSibling)).toBe(
      '<div slot="second-slot"> a second slot, slotted element <span>nested element in the second slot<span></span></span></div>',
    );
    expect(nodeOrEleContent(specPage.root.children[0].nextElementSibling.previousElementSibling)).toBe(
      '<span>a default slot, slotted element</span>',
    );
  });

  it('patches parentNode of slotted nodes', async () => {
    specPage.root.childNodes.forEach((node: Node) => patchSlottedNode(node));
    expect(specPage.root.children[0].parentNode.tagName).toBe('CMP-A');
    expect(specPage.root.children[1].parentNode.tagName).toBe('CMP-A');
    expect(specPage.root.childNodes[0].parentNode.tagName).toBe('CMP-A');
    expect(specPage.root.childNodes[1].parentNode.tagName).toBe('CMP-A');
    expect(specPage.root.children[0].__parentNode.tagName).toBe('DIV');
    expect(specPage.root.childNodes[0].__parentNode.tagName).toBe('DIV');
  });

  it('returns null (not undefined) for out-of-bounds siblings/children', async () => {
    specPage.root.childNodes.forEach((node: Node) => patchSlottedNode(node));

    const firstSlottedNode = specPage.root.childNodes[0];
    expect(firstSlottedNode.previousSibling).toBeNull();

    const lastSlottedNode = specPage.root.childNodes[specPage.root.childNodes.length - 1];
    expect(lastSlottedNode.nextSibling).toBeNull();

    const firstSlottedElement = specPage.root.children[0];
    expect(firstSlottedElement.previousElementSibling).toBeNull();

    const lastSlottedElement = specPage.root.children[specPage.root.children.length - 1];
    expect(lastSlottedElement.nextElementSibling).toBeNull();
  });

  it('returns null (not undefined) for firstChild/lastChild on empty patched hosts', async () => {
    const emptyPage = await newSpecPage({
      components: [],
      html: `<div id="empty"></div>`,
    });
    const emptyElm = emptyPage.root;
    (emptyElm as any).__childNodes = [];
    patchPseudoShadowDom(emptyElm);

    expect(emptyElm.firstChild).toBeNull();
    expect(emptyElm.lastChild).toBeNull();
  });

  it('returns null (not undefined) for parentNode of a node with no parent', async () => {
    const detachedNode = specPage.doc.createElement('span');
    patchSlottedNode(detachedNode);

    expect(detachedNode.parentNode).toBeNull();
  });
});
