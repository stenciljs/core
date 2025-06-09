import { Component, h, Host, Prop, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hostData', () => {
  it('render hostData() attributes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() hidden = false;

      hostData() {
        return {
          value: 'somevalue',
          role: 'alert',
          'aria-hidden': this.hidden ? 'true' : null,
          hidden: this.hidden,
        };
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a role="alert" value="somevalue"></cmp-a>
    `);

    root.hidden = true;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a role="alert" aria-hidden="true" value="somevalue" hidden></cmp-a>
    `);
  });

  it('render <host> attributes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() hidden = false;

      render() {
        return <Host value="hello" role="alert" aria-hidden={this.hidden ? 'true' : null} hidden={this.hidden} />;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a role="alert" value="hello"></cmp-a>
    `);

    root.hidden = true;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a role="alert" value="hello" aria-hidden="true" hidden></cmp-a>
    `);
  });

  it('register <Host> listeners', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @State() count = 0;

      render() {
        return (
          <Host>
            <span>{this.count}</span>
            <cmp-b onClick={() => this.count++}></cmp-b>
          </Host>
        );
      }
    }

    @Component({ tag: 'cmp-b' })
    class CmpB {
      @State() count = 0;

      render() {
        return <Host onClick={() => this.count++}>{this.count}</Host>;
      }
    }

    const { doc, root, waitForChanges } = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a><span>0</span><cmp-b>0</cmp-b></cmp-a>
    `);

    (doc.querySelector('cmp-b') as any).click();
    await waitForChanges();

    expect(root).toEqualHtml(`
    <cmp-a><span>1</span><cmp-b>1</cmp-b></cmp-a>
    `);
  });
});
