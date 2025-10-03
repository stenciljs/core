import { Component, Element, Prop, PropSerialize, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { withSilentWarn } from '../../testing/testing-utils';

describe('attribute serialization', () => {
  it('serializer is called each time a attribute changes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      method1Called = 0;
      method2Called = 0;

      @Prop() prop1 = 1;
      @State() someState = 'hello';

      @PropSerialize('prop1')
      @PropSerialize('someState')
      method1(newValue: any) {
        this.method1Called++;
        return newValue;
      }

      @PropSerialize('prop1')
      method2(newValue: any) {
        this.method2Called++;
        return newValue;
      }

      componentDidLoad() {
        expect(this.method1Called).toBe(1);
        expect(this.method2Called).toBe(1);
        expect(this.prop1).toBe(1);
        expect(this.someState).toBe('hello');
      }
    }

    const { root, rootInstance, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method1');
    jest.spyOn(rootInstance, 'method2');

    expect(rootInstance.method1Called).toBe(1);
    expect(rootInstance.method2Called).toBe(1);

    // attr changes should not call serializers
    root.setAttribute('prop1', '100');
    await waitForChanges();
    expect(rootInstance.method1Called).toBe(1);
    expect(rootInstance.method2Called).toBe(1);

    // attribute change
    root.prop1 = 200;
    await waitForChanges();

    expect(rootInstance.method1Called).toBe(2);
    expect(rootInstance.method2Called).toBe(2);
    expect(rootInstance.method1).toHaveBeenLastCalledWith(200, 'prop1');
    expect(rootInstance.method2).toHaveBeenLastCalledWith(200, 'prop1');
    expect(root.prop1).toBe(200);

    // serializer doesn't get called during general re-render
    rootInstance.someState = 'bye??';
    await waitForChanges();

    expect(rootInstance.method1Called).toBe(2);
    expect(rootInstance.method2Called).toBe(2);
  });

  it('should watch for changes correctly', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      watchCalled = 0;
      @Element() host!: HTMLElement;

      @Prop() prop = 10;
      @Prop() value = 10;

      @PropSerialize('prop')
      @PropSerialize('value')
      method(newValue: number) {
        this.watchCalled++;
        return newValue.toString();
      }

      componentWillLoad() {
        // initial render
        this.prop = 1;
        expect(this.watchCalled).toBe(2);
        this.value = 1;
        expect(this.watchCalled).toBe(3);
      }

      componentDidLoad() {
        // setting the same value should not trigger the serializer
        this.prop = 1;
        this.value = 1;
        expect(this.watchCalled).toBe(3);
        this.prop = 20;
        this.value = 30;
        expect(this.watchCalled).toBe(5);
      }
    }

    const { root, rootInstance, waitForChanges } = await withSilentWarn(() =>
      newSpecPage({
        components: [CmpA],
        html: `<cmp-a prop="123"></cmp-a>`,
      }),
    );

    await waitForChanges();
    expect(rootInstance.watchCalled).toBe(5);
    jest.spyOn(rootInstance, 'method');

    // trigger updates in element
    root.prop = 1000;
    await waitForChanges();
    expect(rootInstance.method).toHaveBeenLastCalledWith(1000, 'prop');
    expect(rootInstance.watchCalled).toBe(6);
    expect(root.getAttribute('prop')).toBe('1000');

    root.value = 1300;
    await waitForChanges();
    expect(rootInstance.method).toHaveBeenLastCalledWith(1300, 'value');
    expect(rootInstance.watchCalled).toBe(7);
    expect(root.getAttribute('value')).toBe('1300');
  });

  it('serializer correctly changes the attribute', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() prop1: number | string = 1;
      @Prop() jsonProp = { a: 1, b: 'hello' };

      @PropSerialize('prop1')
      method1(newValue: any) {
        if (newValue === 'something') {
          return '1000';
        }
        return newValue.toString();
      }

      @PropSerialize('jsonProp')
      method2(newValue: any) {
        return JSON.stringify(newValue);
      }
    }

    const { root, rootInstance, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method1');
    jest.spyOn(rootInstance, 'method2');

    // set same values, serializer should not be called ('cos the prop is reflected)
    root.prop1 = 1;
    await waitForChanges();
    expect(rootInstance.method1).toHaveBeenCalledTimes(0);
    expect(rootInstance.method2).toHaveBeenCalledTimes(0);
    expect(root.getAttribute('prop-1')).toBe('1');

    // set different values
    root.prop1 = 100;
    await waitForChanges();
    expect(rootInstance.method1).toHaveBeenCalledTimes(1);
    expect(root.getAttribute('prop-1')).toBe('100');

    // special handling by serializer
    root.prop1 = 'something';
    await waitForChanges();
    expect(rootInstance.method1).toHaveBeenCalledTimes(2);
    expect(root.getAttribute('prop-1')).toBe('1000');
    expect(root.prop1).toBe('something');

    root.jsonProp = { a: 99, b: 'bye' };
    await waitForChanges();
    expect(rootInstance.method2).toHaveBeenCalledTimes(1);
    expect(root.getAttribute('json-prop')).toEqual('{"a":99,"b":"bye"}');
    expect(root.jsonProp).toEqual({ a: 99, b: 'bye' });
  });

  it('removes handles boolean attributes correctly', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop({ reflect: true }) boolProp = false;

      @PropSerialize('boolProp')
      method(newValue: any) {
        return newValue ? '' : null;
      }
    }

    const { root, rootInstance, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    jest.spyOn(rootInstance, 'method');

    expect(rootInstance.method).toHaveBeenCalledTimes(0);
    expect(root.hasAttribute('bool-prop')).toBe(false);

    root.boolProp = true;
    await waitForChanges();
    expect(rootInstance.method).toHaveBeenCalledTimes(1);
    expect(root.hasAttribute('bool-prop')).toBe(true);
    expect(root.getAttribute('bool-prop')).toBe('');

    root.boolProp = false;
    await waitForChanges();
    expect(rootInstance.method).toHaveBeenCalledTimes(2);
    expect(root.hasAttribute('bool-prop')).toBe(false);
  });
});
