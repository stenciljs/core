import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { insertVdomAnnotations } from '../vdom-annotations';

describe('vdom-annotations', () => {
  let root: HTMLElement;

  beforeEach(async () => {
    @Component({ tag: 'component-a-test', scoped: true })
    class ComponentA {
      render() {
        return (
          <div>
            <slot></slot>
          </div>
        );
      }
    }

    @Component({ tag: 'component-b-test', scoped: true })
    class ComponentB {
      render() {
        return (
          <div>
            <slot></slot>
          </div>
        );
      }
    }

    const { root: rootElm } = await newSpecPage({
      components: [ComponentA, ComponentB],
      html: `<section>
        <component-a-test>slotContent</component-a-test>
        <component-b-test>slotContent</component-b-test>
      </section>`,
    });
    root = rootElm;
  });

  it('should add annotations when no static component is given', () => {
    insertVdomAnnotations(root.ownerDocument, []);
    /**
      <section>
        <component-a-test s-id="1">
            <!--r.1-->o.0.1
            <div c-id="1.0.0.0">
              <!--t.1.1.1.0--> <!--t.0.1-->slotContent
            </div>
        </component-a-test>
        <component-b-test s-id="2">
            <!--r.2-->o.0.2
            <div c-id="2.0.0.0">
              <!--t.2.1.1.0--> <!--t.0.2-->slotContent
            </div>
        </component-b-test>
      </section>
     */
    expect(root.ownerDocument.body.innerHTML).toMatchSnapshot();
  });

  it('should add annotations when component-a-test is given as static component', () => {
    insertVdomAnnotations(root.ownerDocument, ['component-a-test']);
    /**
      <section>
        <component-a-test>
            <!---->o.0.1
            <div>
              <!--t.0.1-->slotContent
            </div>
        </component-a-test>
        <component-b-test s-id="1">
            <!--r.1-->o.0.2
            <div c-id="1.0.0.0">
              <!--t.1.1.1.0--> <!--t.0.2-->slotContent
            </div>
        </component-b-test>
      </section>
     */
    expect(root.ownerDocument.body.innerHTML).toMatchSnapshot();
  });

  it('should add annotations when component-a-test and component-b-test is given as static component', () => {
    insertVdomAnnotations(root.ownerDocument, ['component-a-test', 'component-b-test']);
    /**
      <section>
        <component-a-test>
            <!---->o.0.1
            <div>
              <!--t.0.1-->slotContent
            </div>
        </component-a-test>
        <component-b-test>
            <!---->o.0.2
            <div>
              <!--t.0.2-->slotContent
            </div>
        </component-b-test>
      </section>
     */
    expect(root.ownerDocument.body.innerHTML).toMatchSnapshot();
  });
});
