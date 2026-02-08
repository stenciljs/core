import { Build, Component, Env } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('globals', () => {
  @Component({
    tag: 'cmp-a',
  })
  class CmpA {}

  // eslint-disable-next-line jest/expect-expect -- there's not a great way to `expect()` that `raf()` and `setTimeout()` do not throw here
  it('should resolve raf and setTimeout', async () => {
    const page = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      autoApplyChanges: true,
    });
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        page.win.requestAnimationFrame(() => {
          setTimeout(() => {
            page.win.setTimeout(() => {
              resolve();
            }, 10);
          }, 10);
        });
      });
    });
  });

  it('allows access to window.JSON', async () => {
    expect(JSON.stringify([0])).toEqual('[0]');
    expect((window as any).JSON.stringify([0])).toEqual('[0]');
  });

  it('build values', () => {
    expect(Build.isBrowser).toBe(false);
    expect(Build.isDev).toBe(true);
    expect(Build.isTesting).toBe(true);
    expect(Build.isServer).toBe(true);
  });

  it('Env is defined', () => {
    expect(Env).toEqual({});
  });

  describe('globals/prototypes', () => {
    let page: any;
    beforeEach(async () => {
      @Component({ tag: 'cmp-el' })
      class CmpEl {
        // @ts-ignore
        protoEl: any;
        protoNode: any;
        protoNodeList: any;

        constructor() {
          this.protoEl = Element.prototype;
          this.protoNode = Node.prototype;
          this.protoNodeList = NodeList.prototype;
        }
      }

      page = await newSpecPage({
        components: [CmpEl],
        html: `<cmp-el></cmp-el>`,
      });
    });

    it('allows access to the Node prototype', async () => {
      expect(page.rootInstance.protoNode).toEqual(Node.prototype);
      expect(page.rootInstance.protoNode).toEqual((page.win as any).Node.prototype);
      expect(page.rootInstance.protoNode).toEqual((window as any).Node.prototype);
      expect(page.rootInstance.protoNode).toEqual((global as any).Node.prototype);
      expect(page.rootInstance.protoNode).toBeTruthy();
    });

    it('allows access to the NodeList prototype', async () => {
      expect(page.rootInstance.protoNodeList).toEqual(NodeList.prototype);
      expect(page.rootInstance.protoNodeList).toEqual((page.win as any).NodeList.prototype);
      expect(page.rootInstance.protoNodeList).toEqual((window as any).NodeList.prototype);
      expect(page.rootInstance.protoNodeList).toEqual((global as any).NodeList.prototype);
      expect(page.rootInstance.protoNodeList).toBeTruthy();
    });

    it('allows access to the Element prototype', async () => {
      expect(page.rootInstance.protoEl).toEqual(Element.prototype);
      expect(page.rootInstance.protoEl).toEqual((page.win as any).Element.prototype);
      expect(page.rootInstance.protoEl).toEqual((window as any).Element.prototype);
      expect(page.rootInstance.protoEl).toEqual((global as any).Element.prototype);
      expect(page.rootInstance.protoEl).toBeTruthy();
    });

    it('allows access to the KeyboardEvent', async () => {
      expect(window.KeyboardEvent).toEqual(KeyboardEvent);
      expect(global.KeyboardEvent).toEqual(KeyboardEvent);
      expect(page.rootInstance.protoEl).toEqual((page.win as any).Element.prototype);
      expect(page.rootInstance.protoEl).toEqual((window as any).Element.prototype);
      expect(page.rootInstance.protoEl).toEqual((global as any).Element.prototype);
      expect(page.rootInstance.protoEl).toBeTruthy();
    });
  });
});
