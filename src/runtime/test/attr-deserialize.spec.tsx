import { Component, Method, Prop, State, AttrDeserialize, Element } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { withSilentWarn } from '../../testing/testing-utils';

describe('attribute deserialization', () => {
  it('deserializer is called each time a attribute changes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      method1Called = 0;
      method2Called = 0;

      @Prop() prop1 = 1;
      @State() someState = 'hello';

      @AttrDeserialize('prop1')
      @AttrDeserialize('someState')
      method1(newValue: any) {
        this.method1Called++;
        return newValue;
      }

      @AttrDeserialize('prop1')
      method2(newValue: any) {
        this.method2Called++;
        return newValue;
      }

      componentDidLoad() {
        expect(this.method1Called).toBe(0);
        expect(this.method2Called).toBe(0);
        expect(this.prop1).toBe(1);
        expect(this.someState).toBe('hello');
      }
    }

    const { root, rootInstance, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a prop-1="123"></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method1');
    jest.spyOn(rootInstance, 'method2');

    // spies were wired up after initial load
    expect(rootInstance.method1Called).toBe(1);
    expect(rootInstance.method2Called).toBe(1);

    // prop changes should not call deserializers
    root.prop1 = 100;
    await waitForChanges();
    expect(rootInstance.method1Called).toBe(1);
    expect(rootInstance.method2Called).toBe(1);

    // attribute change
    root.setAttribute('prop-1', '200');

    expect(rootInstance.method1Called).toBe(2);
    expect(rootInstance.method2Called).toBe(2);
    expect(rootInstance.method1).toHaveBeenLastCalledWith('200', 'prop1');
    expect(rootInstance.method2).toHaveBeenLastCalledWith('200', 'prop1');
    expect(root.prop1).toBe(200);

    // deserializer should not be called on state change
    rootInstance.someState = 'bye';
    expect(rootInstance.method1Called).toBe(2);
    expect(rootInstance.method2Called).toBe(2);
  });

  it('should watch correctly', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      watchCalled = 0;
      @Element() host!: HTMLElement;

      @Prop() prop = 10;
      @Prop() value = 10;

      @AttrDeserialize('prop')
      @AttrDeserialize('value')
      method() {
        this.watchCalled++;
      }

      componentWillLoad() {
        expect(this.watchCalled).toBe(0);
        this.host.setAttribute('prop', '1');
        expect(this.watchCalled).toBe(1);
        this.host.setAttribute('value', '1');
        expect(this.watchCalled).toBe(2);
      }

      componentDidLoad() {
        expect(this.watchCalled).toBe(2);
        // setting the same value should not trigger the deserializer
        this.host.setAttribute('prop', '1');
        this.host.setAttribute('value', '1');
        expect(this.watchCalled).toBe(2);
        this.host.setAttribute('prop', '20');
        this.host.setAttribute('value', '30');
        expect(this.watchCalled).toBe(4);
      }
    }

    const { root, rootInstance } = await withSilentWarn(() =>
      newSpecPage({
        components: [CmpA],
        html: `<cmp-a prop="123"></cmp-a>`,
      }),
    );

    expect(rootInstance.watchCalled).toBe(5);
    jest.spyOn(rootInstance, 'method');

    // trigger updates in element
    root.setAttribute('prop', '1000');
    expect(rootInstance.method).toHaveBeenLastCalledWith('1000', 'prop');

    root.setAttribute('value', '1300');
    expect(rootInstance.method).toHaveBeenLastCalledWith('1300', 'value');
  });

  it('deserializer correctly changes the property', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop({ reflect: true }) prop1 = 1;
      @Prop() jsonProp = { a: 1, b: 'hello' };

      @AttrDeserialize('prop1')
      method1(newValue: any) {
        if (newValue === 'something') {
          return 1000;
        }
        return newValue;
      }

      @AttrDeserialize('jsonProp')
      method2(newValue: any) {
        return JSON.parse(newValue);
      }
    }

    const { root, rootInstance } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method1');
    jest.spyOn(rootInstance, 'method2');

    // set same values, deserializer should not be called ('cos the prop is reflected)
    root.setAttribute('prop-1', '1');
    expect(rootInstance.method1).toHaveBeenCalledTimes(0);
    expect(rootInstance.method2).toHaveBeenCalledTimes(0);
    expect(root.prop1).toBe(1);

    // set different values
    root.setAttribute('prop-1', '100');
    expect(rootInstance.method1).toHaveBeenCalledTimes(1);
    expect(root.prop1).toBe(100);

    // special handling by deserializer
    root.setAttribute('prop-1', 'something');
    expect(rootInstance.method1).toHaveBeenCalledTimes(2);
    expect(root.prop1).toBe(1000);

    root.setAttribute('json-prop', '{"a":99,"b":"bye"}');
    expect(rootInstance.method2).toHaveBeenCalledTimes(1);
    expect(root.jsonProp).toEqual({ a: 99, b: 'bye' });
  });
});
