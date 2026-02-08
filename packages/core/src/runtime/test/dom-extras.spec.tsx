import { Component, h, Host } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';

import { patchPseudoShadowDom, patchSlottedNode } from '../../runtime/dom-extras';

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
});
