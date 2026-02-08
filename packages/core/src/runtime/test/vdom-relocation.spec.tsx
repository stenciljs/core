import { Component, h, Listen, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('vdom-relocation', () => {
  it('vdom-relocation', async () => {
    @Component({
      tag: 'my-root',
    })
    class Root {
      @State() data = [1, 2, 3];
      @Listen('click')
      onclick() {
        this.data = [...this.data, this.data.length + 1];
      }

      render() {
        return (
          <my-child>
            {this.data.map((a) => (
              <div>{a}</div>
            ))}
          </my-child>
        );
      }
    }

    @Component({
      tag: 'my-child',
    })
    class Child {
      render() {
        return (
          <div class="wrapper">
            <slot></slot>
          </div>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Root, Child],
      html: `<my-root></my-root>`,
    });

    expect(root).toEqualHtml(`
<my-root>
  <my-child>
    <div class=\"wrapper\">
      <div>1</div>
      <div>2</div>
      <div>3</div>
    </div>
  </my-child>
</my-root>`);

    root.click();
    await waitForChanges();

    expect(root).toEqualHtml(`
  <my-root>
    <my-child>
      <div class=\"wrapper\">
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </div>
    </my-child>
  </my-root>`);
  });
});
