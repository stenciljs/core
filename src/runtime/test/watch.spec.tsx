import { Component, Method, Prop, State, Watch } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { withSilentWarn } from '../../testing/testing-utils';

describe('watch', () => {
  it('watch is called each time a prop changes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      method1Called = 0;
      method2Called = 0;

      @Prop() prop1 = 1;
      @State() someState = 'hello';

      @Watch('prop1')
      @Watch('someState')
      method1() {
        this.method1Called++;
      }

      @Watch('prop1')
      method2() {
        this.method2Called++;
      }

      componentDidLoad() {
        expect(this.method1Called).toBe(0);
        expect(this.method2Called).toBe(0);
        expect(this.prop1).toBe(1);
        expect(this.someState).toBe('hello');
      }
    }

    const { root, rootInstance } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method1');
    jest.spyOn(rootInstance, 'method2');

    // set same values, watch should not be called
    root.prop1 = 1;
    rootInstance.someState = 'hello';
    expect(rootInstance.method1).toHaveBeenCalledTimes(0);
    expect(rootInstance.method2).toHaveBeenCalledTimes(0);

    // set different values
    root.prop1 = 100;
    expect(rootInstance.method1).toHaveBeenCalledTimes(1);
    expect(rootInstance.method1).toHaveBeenLastCalledWith(100, 1, 'prop1');
    expect(rootInstance.method2).toHaveBeenCalledTimes(1);
    expect(rootInstance.method2).toHaveBeenLastCalledWith(100, 1, 'prop1');

    rootInstance.someState = 'bye';
    expect(rootInstance.method2).toHaveBeenCalledTimes(1);
    expect(rootInstance.method1).toHaveBeenLastCalledWith('bye', 'hello', 'someState');
  });

  it('should Watch correctly', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      watchCalled = 0;

      @Prop({ mutable: true }) prop = 10;
      @Prop({ mutable: true }) value = 10;
      @State({ mutable: true }) someState = 'default';

      @Watch('prop')
      @Watch('value')
      @Watch('someState')
      method() {
        this.watchCalled++;
      }

      componentWillLoad() {
        expect(this.watchCalled).toBe(0);
        this.prop = 1;
        expect(this.watchCalled).toBe(1);
        this.value = 1;
        expect(this.watchCalled).toBe(2);
        this.someState = 'hello';
        expect(this.watchCalled).toBe(3);
      }

      componentDidLoad() {
        expect(this.watchCalled).toBe(3);
        this.prop = 1;
        this.value = 1;
        this.someState = 'hello';
        expect(this.watchCalled).toBe(3);
        this.prop = 20;
        this.value = 30;
        this.someState = 'bye';
        expect(this.watchCalled).toBe(6);
      }
    }

    const { root, rootInstance } = await withSilentWarn(() =>
      newSpecPage({
        components: [CmpA],
        html: `<cmp-a prop="123"></cmp-a>`,
      }),
    );

    expect(rootInstance.watchCalled).toBe(6);
    jest.spyOn(rootInstance, 'method');

    // trigger updates in element
    root.prop = 1000;
    expect(rootInstance.method).toHaveBeenLastCalledWith(1000, 20, 'prop');

    root.value = 1300;
    expect(rootInstance.method).toHaveBeenLastCalledWith(1300, 30, 'value');
  });

  it('should Watch from lifecycles', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      renderCount = 0;
      watchCalled = 0;

      @State() state = 0;
      @Watch('state')
      method() {
        this.watchCalled++;
      }

      @Method()
      async pushState() {
        this.state++;
      }

      connectedCallback() {
        expect(this.watchCalled).toBe(0);
        this.state = 1;
        expect(this.watchCalled).toBe(1);
        this.state = 1;
        expect(this.watchCalled).toBe(1);
        this.state = 2;
        expect(this.watchCalled).toBe(2);
      }

      componentWillLoad() {
        expect(this.watchCalled).toBe(2);
        this.state = 3;
        expect(this.watchCalled).toBe(3);
      }

      componentDidLoad() {
        this.state = 4;
        expect(this.watchCalled).toBe(4);
      }

      render() {
        this.renderCount++;
        return `${this.renderCount} ${this.state} ${this.watchCalled}`;
      }
    }

    const { root, waitForChanges } = await withSilentWarn(() =>
      newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      }),
    );

    expect(root).toEqualHtml(`<cmp-a>2 4 4</cmp-a>`);
    await waitForChanges();
    await waitForChanges();
    expect(root).toEqualHtml(`<cmp-a>2 4 4</cmp-a>`);

    await root.pushState();
    await waitForChanges();
    expect(root).toEqualHtml(`<cmp-a>3 5 5</cmp-a>`);
  });

  it('correctly calls watch when @Prop uses `set()', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      method1Called = 0;

      private _prop1 = 1;
      @Prop()
      get prop1() {
        return this._prop1;
      }
      set prop1(newProp: number) {
        if (isNaN(newProp)) return;
        this._prop1 = newProp;
      }

      @Watch('prop1')
      method1() {
        this.method1Called++;
      }

      componentDidLoad() {
        expect(this.method1Called).toBe(0);
        expect(this.prop1).toBe(1);
      }
    }

    const { root, rootInstance } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method1');

    // set same values, watch should not be called
    root.prop1 = 1;
    expect(rootInstance.method1).toHaveBeenCalledTimes(0);

    // set different values
    root.prop1 = 100;
    expect(rootInstance.method1).toHaveBeenCalledTimes(1);
    expect(rootInstance.method1).toHaveBeenLastCalledWith(100, 1, 'prop1');

    // guard has prevented the watch from being called
    root.prop1 = 'bye';
    expect(root.prop1).toBe(100);
    expect(rootInstance.method1).toHaveBeenCalledTimes(1);
    expect(rootInstance.method1).toHaveBeenLastCalledWith(100, 1, 'prop1');
  });
});
