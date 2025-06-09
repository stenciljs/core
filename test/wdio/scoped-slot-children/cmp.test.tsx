import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-children', function () {
  const nodeOrEleContent = (node: Node | Element) => {
    return (node as Element)?.outerHTML || node?.nodeValue?.trim();
  };

  beforeEach(async () => {
    render({
      template: () => (
        <scoped-slot-children>
          Some default slot, slotted text
          <span>a default slot, slotted element</span>
          <div slot="second-slot">
            a second slot, slotted element
            <span> nested element in the second slot</span>
          </div>
        </scoped-slot-children>
      ),
    });
  });

  it('patches `childNodes` to return only nodes that have been slotted', async () => {
    await $('scoped-slot-children').waitForStable();

    const childNodes = () => document.querySelector('scoped-slot-children').childNodes;
    const innerChildNodes = () =>
      (document.querySelector('scoped-slot-children') as any).__childNodes as NodeListOf<ChildNode>;

    expect(nodeOrEleContent(childNodes()[0])).toBe(`Some default slot, slotted text`);
    expect(nodeOrEleContent(childNodes()[1])).toBe(`<span>a default slot, slotted element</span>`);
    expect(nodeOrEleContent(childNodes()[2])).toBe(
      `<div slot="second-slot">a second slot, slotted element<span> nested element in the second slot</span></div>`,
    );

    expect(nodeOrEleContent(innerChildNodes()[4])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);

    childNodes()[0].remove();
    expect(nodeOrEleContent(childNodes()[0])).toBe(`<span>a default slot, slotted element</span>`);

    expect(nodeOrEleContent(innerChildNodes()[4])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);

    childNodes()[0].remove();
    expect(nodeOrEleContent(childNodes()[0])).toBe(
      `<div slot="second-slot">a second slot, slotted element<span> nested element in the second slot</span></div>`,
    );

    expect(nodeOrEleContent(innerChildNodes()[4])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);

    childNodes()[0].remove();
    expect(nodeOrEleContent(childNodes()[0])).toBe(undefined);

    expect(nodeOrEleContent(innerChildNodes()[4])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);
  });

  it('patches `children` to return only elements that have been slotted', async () => {
    await $('scoped-slot-children').waitForStable();

    const children = () => document.querySelector('scoped-slot-children').children;
    const innerChildren = () =>
      (document.querySelector('scoped-slot-children') as any).__children as NodeListOf<Element>;

    expect(nodeOrEleContent(children()[0])).toBe(`<span>a default slot, slotted element</span>`);
    expect(nodeOrEleContent(children()[1])).toBe(
      `<div slot="second-slot">a second slot, slotted element<span> nested element in the second slot</span></div>`,
    );
    expect(nodeOrEleContent(children()[2])).toBe(undefined);

    expect(nodeOrEleContent(innerChildren()[0])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);

    children()[0].remove();
    expect(nodeOrEleContent(children()[0])).toBe(
      `<div slot="second-slot">a second slot, slotted element<span> nested element in the second slot</span></div>`,
    );
    expect(nodeOrEleContent(innerChildren()[0])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);

    children()[0].remove();
    expect(nodeOrEleContent(children()[0])).toBe(undefined);
    expect(nodeOrEleContent(innerChildren()[0])).toBe(`<p class="sc-scoped-slot-children">internal text 1</p>`);
  });

  it('patches `firstChild` to return only the first slotted node', async () => {
    await $('scoped-slot-children').waitForStable();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').firstChild)).toBe(
      `Some default slot, slotted text`,
    );

    document.querySelector('scoped-slot-children').firstChild.remove();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').firstChild)).toBe(
      `<span>a default slot, slotted element</span>`,
    );

    document.querySelector('scoped-slot-children').firstChild.remove();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').firstChild)).toBe(
      `<div slot=\"second-slot\">a second slot, slotted element<span> nested element in the second slot</span></div>`,
    );

    document.querySelector('scoped-slot-children').firstChild.remove();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').firstChild)).toBe(undefined);
  });

  it('patches `lastChild` to return only the last slotted node', async () => {
    await $('scoped-slot-children').waitForStable();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').lastChild)).toBe(
      `<div slot="second-slot">a second slot, slotted element<span> nested element in the second slot</span></div>`,
    );

    document.querySelector('scoped-slot-children').lastChild.remove();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').lastChild)).toBe(
      `<span>a default slot, slotted element</span>`,
    );

    document.querySelector('scoped-slot-children').lastChild.remove();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').lastChild)).toBe(
      `Some default slot, slotted text`,
    );

    document.querySelector('scoped-slot-children').lastChild.remove();
    expect(nodeOrEleContent(document.querySelector('scoped-slot-children').lastChild)).toBe(undefined);
  });
});
