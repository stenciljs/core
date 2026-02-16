import { Component, forceUpdate, h, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('scoped slot', () => {
  it('should relocate nested default slot nodes', async () => {
    @Component({ tag: 'ion-test', scoped: true })
    class CmpA {
      render() {
        return (
          <spider>
            <slot></slot>
          </spider>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<ion-test>88</ion-test>`,
    });

    expect(root.firstElementChild.nodeName).toBe('SPIDER');
    expect(root.firstElementChild.childNodes[1].textContent).toBe('88');
    expect(root.firstElementChild.childNodes).toHaveLength(2);
  });

  it('should use components default slot text content', async () => {
    @Component({ tag: 'ion-test', scoped: true })
    class CmpA {
      render() {
        return (
          <spider>
            <slot>default content</slot>
          </spider>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<ion-test></ion-test>`,
    });

    expect(root.firstElementChild.nodeName).toBe('SPIDER');
    expect(root.firstElementChild.children).toHaveLength(1);
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SLOT-FB');
    expect(root.firstElementChild.firstElementChild.textContent).toBe('default content');
    expect(root.firstElementChild.firstElementChild.childNodes).toHaveLength(1);
  });

  it('should use components default slot node content', async () => {
    @Component({ tag: 'ion-test', scoped: true })
    class CmpA {
      render() {
        return (
          <spider>
            <slot>
              <div>default content</div>
            </slot>
          </spider>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<ion-test></ion-test>`,
    });

    expect(root.firstElementChild.nodeName).toBe('SPIDER');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SLOT-FB');
    expect(root.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('default content');
  });

  it('should relocate nested named slot nodes', async () => {
    @Component({ tag: 'ion-test', scoped: true })
    class CmpA {
      render() {
        return (
          <monkey>
            <slot name="start"></slot>
          </monkey>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<ion-test><tiger slot="start">88</tiger></ion-test>`,
    });

    expect(root.firstElementChild.nodeName).toBe('MONKEY');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('TIGER');
    expect(root.firstElementChild.firstElementChild.textContent).toBe('88');
    expect(root.firstElementChild.firstElementChild.childNodes).toHaveLength(1);
  });

  it('no content', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <lion>
            <ion-child></ion-child>
          </lion>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return <slot></slot>;
      }
    }

    const { root } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild.nodeName).toBe('LION');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.children).toHaveLength(0);
  });

  it('no content, nested child slot', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <giraffe>
            <ion-child></ion-child>
          </giraffe>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return (
          <fish>
            <slot></slot>
          </fish>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild.nodeName).toBe('GIRAFFE');
    expect(root.firstElementChild.children).toHaveLength(1);
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.children).toHaveLength(1);
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('FISH');
    expect(root.firstElementChild.firstElementChild.firstElementChild.children).toHaveLength(0);
  });

  it('should put parent content in child default slot', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <hippo>
            <ion-child>
              <aardvark>parent message</aardvark>
            </ion-child>
          </hippo>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return <slot></slot>;
      }
    }

    const { root } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('HIPPO');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('AARDVARK');
    expect(root.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('parent message');
  });

  it('should relocate parent content after child content dynamically changes slot wrapper tag', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      @Prop() innerH = (<h1>parent text</h1>);

      render() {
        return <ion-child>{this.innerH}</ion-child>;
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      @Prop() Tag = 'section';

      render() {
        return (
          <this.Tag>
            <slot></slot>
          </this.Tag>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SECTION');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('H1');
    expect(root.firstElementChild.textContent).toBe('parent text');

    root.innerH = <h6>parent text update</h6>;
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SECTION');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('H6');
    expect(root.firstElementChild.textContent).toBe('parent text update');

    const child = root.querySelector('ion-child');
    child.Tag = 'article';
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ARTICLE');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('H6');
    expect(root.firstElementChild.textContent).toBe('parent text update');
  });

  it('should put parent content in child nested default slot', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <badger>
            <ion-child>
              <dingo>parent message</dingo>
            </ion-child>
          </badger>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return (
          <camel>
            <owl>
              <slot></slot>
            </owl>
          </camel>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('BADGER');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('CAMEL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('OWL');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName,
    ).toBe('DINGO');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent,
    ).toBe('parent message');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('BADGER');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('CAMEL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('OWL');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName,
    ).toBe('DINGO');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent,
    ).toBe('parent message');
  });

  it('should render conditional content into a nested default slot', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <ion-child>
            <slot></slot>
          </ion-child>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      test = 0;

      render() {
        this.test++;

        if (this.test === 1) {
          return null;
        }

        if (this.test === 2) {
          return [<div>content 1</div>, <div>content 2</div>];
        }

        if (this.test === 3) {
          return null;
        }

        return <div>content 4</div>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.textContent).toBe('');

    const child = root.querySelector('ion-child');
    forceUpdate(child);
    await waitForChanges();

    expect(root.firstElementChild.textContent).toBe('content 1content 2');

    forceUpdate(child);
    await waitForChanges();

    expect(root.firstElementChild.textContent).toBe('');

    forceUpdate(child);
    await waitForChanges();
    expect(root.firstElementChild.textContent).toBe('content 4');
  });

  it('should update parent content in child default slot', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      @Prop() msg = 'parent message';
      render() {
        return (
          <cheetah>
            <ion-child>
              <bear>{this.msg}</bear>
            </ion-child>
          </cheetah>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return (
          <chipmunk>
            <slot></slot>
          </chipmunk>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('CHEETAH');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('CHIPMUNK');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('BEAR');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent).toBe(
      'parent message',
    );

    root.msg = 'change 1';
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('CHEETAH');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('CHIPMUNK');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('BEAR');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('change 1');

    root.msg = 'change 2';
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('CHEETAH');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('CHIPMUNK');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('BEAR');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('change 2');
  });

  it('should update parent content inner text in child nested default slot', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      @Prop() msg = 'parent message';
      render() {
        return (
          <ion-child>
            <whale>{this.msg}</whale>
          </ion-child>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return (
          <bull>
            <slot></slot>
          </bull>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('BULL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('WHALE');
    expect(root.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('parent message');

    root.msg = 'change 1';
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('BULL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('WHALE');
    expect(root.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('change 1');

    root.msg = 'change 2';
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('BULL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('WHALE');
    expect(root.firstElementChild.firstElementChild.firstElementChild.textContent).toBe('change 2');
  });

  it('should allow multiple slots with same name', async () => {
    let values = 0;

    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <ion-child>
            <falcon slot="start">{++values}</falcon>
            <eagle slot="start">{++values}</eagle>
          </ion-child>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return (
          <mouse>
            <slot></slot>
            <slot name="start"></slot>
            <slot name="end"></slot>
          </mouse>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('MOUSE');
    expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('FALCON');
    expect(root.firstElementChild.firstElementChild.children[0].textContent).toBe('1');
    expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('EAGLE');
    expect(root.firstElementChild.firstElementChild.children[1].textContent).toBe('2');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('MOUSE');
    expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('FALCON');
    expect(root.firstElementChild.firstElementChild.children[0].textContent).toBe('3');
    expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('EAGLE');
    expect(root.firstElementChild.firstElementChild.children[1].textContent).toBe('4');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('MOUSE');
    expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('FALCON');
    expect(root.firstElementChild.firstElementChild.children[0].textContent).toBe('5');
    expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('EAGLE');
    expect(root.firstElementChild.firstElementChild.children[1].textContent).toBe('6');
  });

  it('should only render nested named slots and default slot', async () => {
    let values = 0;

    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <ion-child>
            <butterfly>{(++values).toString()}</butterfly>
            <fox slot="end">{++values}</fox>
            <ferret slot="start">{++values}</ferret>
          </ion-child>
        );
      }
    }

    @Component({ tag: 'ion-child', scoped: true })
    class Child {
      render() {
        return (
          <flamingo>
            <slot name="start"></slot>
            <horse>
              <slot></slot>
              <bullfrog>
                <slot name="end"></slot>
              </bullfrog>
            </horse>
          </flamingo>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Child],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('FLAMINGO');
    expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('FERRET');
    expect(root.firstElementChild.firstElementChild.children[0].textContent).toBe('3');
    expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('HORSE');
    expect(root.firstElementChild.firstElementChild.children[1].children[0].nodeName).toBe('BUTTERFLY');
    expect(root.firstElementChild.firstElementChild.children[1].children[0].textContent).toBe('1');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].nodeName).toBe('BULLFROG');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].children[0].nodeName).toBe('FOX');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].children[0].textContent).toBe('2');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('FLAMINGO');
    expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('FERRET');
    expect(root.firstElementChild.firstElementChild.children[0].textContent).toBe('6');
    expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('HORSE');
    expect(root.firstElementChild.firstElementChild.children[1].children[0].nodeName).toBe('BUTTERFLY');
    expect(root.firstElementChild.firstElementChild.children[1].children[0].textContent).toBe('4');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].nodeName).toBe('BULLFROG');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].children[0].nodeName).toBe('FOX');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].children[0].textContent).toBe('5');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('ION-CHILD');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('FLAMINGO');
    expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('FERRET');
    expect(root.firstElementChild.firstElementChild.children[0].textContent).toBe('9');
    expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('HORSE');
    expect(root.firstElementChild.firstElementChild.children[1].children[0].nodeName).toBe('BUTTERFLY');
    expect(root.firstElementChild.firstElementChild.children[1].children[0].textContent).toBe('7');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].nodeName).toBe('BULLFROG');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].children[0].nodeName).toBe('FOX');
    expect(root.firstElementChild.firstElementChild.children[1].children[1].children[0].textContent).toBe('8');
  });

  it('should allow nested default slots', async () => {
    let values = 0;

    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <test-1>
            <test-2>
              <goat>{(++values).toString()}</goat>
            </test-2>
          </test-1>
        );
      }
    }

    @Component({ tag: 'test-1', scoped: true })
    class Test1 {
      render() {
        return (
          <seal>
            <slot></slot>
          </seal>
        );
      }
    }

    @Component({ tag: 'test-2', scoped: true })
    class Test2 {
      render() {
        return (
          <goose>
            <slot></slot>
          </goose>
        );
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Parent, Test1, Test2],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('TEST-1');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SEAL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('TEST-2');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('GOOSE');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName,
    ).toBe('GOAT');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent,
    ).toBe('1');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('TEST-1');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SEAL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('TEST-2');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('GOOSE');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName,
    ).toBe('GOAT');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent,
    ).toBe('2');

    forceUpdate(root);
    await waitForChanges();

    expect(root.firstElementChild.nodeName).toBe('TEST-1');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SEAL');
    expect(root.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('TEST-2');
    expect(root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName).toBe('GOOSE');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.nodeName,
    ).toBe('GOAT');
    expect(
      root.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent,
    ).toBe('3');
  });

  it('should allow nested default slots w/ default slot content', async () => {
    @Component({ tag: 'ion-parent', scoped: true })
    class Parent {
      render() {
        return (
          <test-1>
            <test-2>
              <goat>hey goat!</goat>
            </test-2>
          </test-1>
        );
      }
    }

    @Component({ tag: 'test-1', scoped: true })
    class Test1 {
      render() {
        return (
          <seal>
            <slot>
              <div>hey seal!</div>
            </slot>
          </seal>
        );
      }
    }

    @Component({ tag: 'test-2', scoped: true })
    class Test2 {
      render() {
        return (
          <goose>
            <slot>
              <div>hey goose!</div>
            </slot>
          </goose>
        );
      }
    }

    const { root } = await newSpecPage({
      components: [Parent, Test1, Test2],
      html: `<ion-parent></ion-parent>`,
    });

    expect(root.firstElementChild.nodeName).toBe('TEST-1');
    expect(root.firstElementChild.firstElementChild.nodeName).toBe('SEAL');
    // expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    // expect(root.firstElementChild.firstElementChild.children[0].hasAttribute('hidden')).toBe(true);
    // expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('TEST-2');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.nodeName).toBe('GOOSE');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[0].hasAttribute('hidden')).toBe(true);
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[1].nodeName).toBe('GOAT');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[1].textContent).toBe('hey goat!');

    // forceUpdate(root);
    // await waitForChanges();

    // expect(root.firstElementChild.nodeName).toBe('TEST-1');
    // expect(root.firstElementChild.firstElementChild.nodeName).toBe('SEAL');
    // expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    // expect(root.firstElementChild.firstElementChild.children[0].hasAttribute('hidden')).toBe(true);
    // expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('TEST-2');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.nodeName).toBe('GOOSE');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[0].hasAttribute('hidden')).toBe(true);
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[1].nodeName).toBe('GOAT');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[1].textContent).toBe('hey goat!');

    // forceUpdate(root);
    // await waitForChanges();

    // expect(root.firstElementChild.nodeName).toBe('TEST-1');
    // expect(root.firstElementChild.firstElementChild.nodeName).toBe('SEAL');
    // expect(root.firstElementChild.firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    // expect(root.firstElementChild.firstElementChild.children[0].hasAttribute('hidden')).toBe(true);
    // expect(root.firstElementChild.firstElementChild.children[1].nodeName).toBe('TEST-2');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.nodeName).toBe('GOOSE');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[0].hasAttribute('hidden')).toBe(true);
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[1].nodeName).toBe('GOAT');
    // expect(root.firstElementChild.firstElementChild.children[1].firstElementChild.children[1].textContent).toBe('hey goat!');
  });

  it("should hide the slot's fallback content for a scoped component when slot content passed in", async () => {
    @Component({ tag: 'fallback-test', scoped: true })
    class ScopedFallbackSlotTest {
      render() {
        return (
          <div>
            <slot>
              <p>Fallback Content</p>
            </slot>
          </div>
        );
      }
    }
    const { root } = await newSpecPage({
      components: [ScopedFallbackSlotTest],
      html: `<fallback-test><span>Content</span></fallback-test>`,
    });

    expect(root.firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    expect(root.firstElementChild.children[0]).toHaveAttribute('hidden');
  });

  it("should hide the slot's fallback content for a non-shadow component when slot content passed in", async () => {
    @Component({ tag: 'fallback-test', shadow: false })
    class NonShadowFallbackSlotTest {
      render() {
        return (
          <div>
            <slot>
              <p>Fallback Content</p>
            </slot>
          </div>
        );
      }
    }
    const { root } = await newSpecPage({
      components: [NonShadowFallbackSlotTest],
      html: `<fallback-test><span>Content</span></fallback-test>`,
    });

    expect(root.firstElementChild.children[0].nodeName).toBe('SLOT-FB');
    expect(root.firstElementChild.children[0]).toHaveAttribute('hidden');
  });
});
