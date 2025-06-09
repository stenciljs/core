import type * as d from '../../../declarations';
import { NODE_TYPE } from '../../runtime-constants';
import { newVNode } from '../h';
import * as setAccessor from '../set-accessor';
import { updateElement } from '../update-element';

describe('updateElement', () => {
  const createTestNode = (overrides: Partial<d.VNode> = {}): d.VNode => ({
    ...newVNode('div', ''),
    ...overrides,
  });

  it('should add/remove classes', () => {
    const elm = document.createElement('my-tag') as HTMLElement;
    elm.className = 'mr plutonium';
    const oldVNode: d.VNode = {
      ...newVNode('div', ''),
      $flags$: 0,
      $attrs$: { class: 'mr plutonium' },
    };
    const newNode: d.VNode = {
      ...newVNode('div', ''),
      $flags$: 0,
      $elm$: elm,
      $attrs$: { class: 'mr fusion' },
    };
    updateElement(oldVNode, newNode, false);
    expect(elm.className).toBe('mr fusion');
  });

  it('should remove classes when oldVNode.vattrs but no newVNode.attrs', () => {
    const elm = document.createElement('my-tag') as HTMLElement;
    elm.className = 'mr fusion';
    const oldVNode = createTestNode({
      $flags$: 0,
      $attrs$: { class: 'mr fusion' },
    });
    const newVnode = createTestNode({
      $flags$: 0,
      $elm$: elm,
    });
    updateElement(oldVNode, newVnode, false);
    expect(elm.className).toBe('');
  });

  it('should do nothing when class is unchanged', () => {
    const elm = document.createElement('my-tag') as HTMLElement;
    elm.className = 'mr fusion';
    const oldVNode = createTestNode({
      $flags$: 0,
      $attrs$: { class: 'mr fusion' },
    });
    const newVnode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: { class: 'mr fusion' },
    });
    updateElement(oldVNode, newVnode, false);
    expect(elm.className).toBe('mr fusion');
  });

  it('should add new classes when no oldVNode.vattrs', () => {
    const elm = document.createElement('my-tag') as HTMLElement;
    const oldVNode: d.VNode = newVNode('my-component', 'text value');
    const newVnode: d.VNode = newVNode('my-component', 'text value');
    newVnode.$elm$ = elm;
    newVnode.$attrs$ = { class: 'mr fusion' };
    updateElement(oldVNode, newVnode, false);
    expect(elm.className).toBe('mr fusion');
  });

  it('should add new class when no oldVNode', () => {
    const elm = document.createElement('my-tag') as HTMLElement;
    const oldVNode: null = null;
    const newVnode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: { class: 'mr fusion' },
    });
    updateElement(oldVNode, newVnode, false);
    expect(elm.className).toBe('mr fusion');
  });

  it('should do nothing when no newVnode attrs', () => {
    expect(() => {
      const elm = document.createElement('my-tag') as HTMLElement;
      const oldVNode: null = null;
      const newVnode = createTestNode({
        $flags$: 0,
        $elm$: elm,
      });
      updateElement(oldVNode, newVnode, false);
    }).not.toThrow();
  });

  it('should use host element on shadow root element when using shadow dom', () => {
    const elm: any = {
      host: document.createElement('div') as HTMLElement,
      nodeType: NODE_TYPE.DocumentFragment,
    };
    const oldVNode: null = null;
    const newVnode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: {
        class: 'mr fusion',
        style: { color: 'gray' },
      },
    });
    updateElement(oldVNode, newVnode, false);
    expect(elm.host.className).toBe('mr fusion');
    expect(elm.host.style.color).toBe('gray');
  });

  it('should use host element when using an element with a "host" property', () => {
    const elm: any = document.createElement('a') as HTMLElement;
    elm.host = 'localhost:8888';
    const oldVNode: null = null;
    const newVnode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: {
        class: 'mr fusion',
        style: { color: 'gray' },
      },
    });
    updateElement(oldVNode, newVnode, false);
    expect(elm.className).toBe('mr fusion');
    expect(elm.style.color).toBe('gray');
  });

  it('should use host element when not shadow dom', () => {
    const elm = document.createElement('my-tag') as HTMLElement;
    const oldVNode: null = null;
    const newVnode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: {
        class: 'mr fusion',
        style: { color: 'gray' },
      },
    });
    updateElement(oldVNode, newVnode, false);
    expect(elm.className).toBe('mr fusion');
    expect(elm.style.color).toBe('gray');
  });

  it('max test', () => {
    const spy = jest.spyOn(setAccessor, 'setAccessor');
    const elm = document.createElement('section') as HTMLElement;
    const initialVNode: null = null;
    const firstVNode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: {
        content: 'attributes removed',
        padding: false,
        bold: 'false',
        'no-attr': null,
      },
    });
    const secondVNode = createTestNode({
      $flags$: 0,
      $elm$: elm,
      $attrs$: {
        content: 'attributes added',
        padding: true,
        bold: 'true',
        margin: '',
        color: 'lime',
        'no-attr': null,
      },
    });
    updateElement(initialVNode, firstVNode, false);
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenNthCalledWith(1, elm, 'content', undefined, 'attributes removed', false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(2, elm, 'padding', undefined, false, false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(3, elm, 'bold', undefined, 'false', false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(4, elm, 'no-attr', undefined, null, false, 0, undefined);
    spy.mockReset();

    updateElement(firstVNode, secondVNode, false);
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy).toHaveBeenNthCalledWith(
      1,
      elm,
      'content',
      'attributes removed',
      'attributes added',
      false,
      0,
      undefined,
    );
    expect(spy).toHaveBeenNthCalledWith(2, elm, 'padding', false, true, false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(3, elm, 'bold', 'false', 'true', false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(4, elm, 'margin', undefined, '', false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(5, elm, 'color', undefined, 'lime', false, 0, undefined);
    spy.mockReset();

    updateElement(secondVNode, firstVNode, false);
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy).toHaveBeenNthCalledWith(1, elm, 'margin', '', undefined, false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(2, elm, 'color', 'lime', undefined, false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(
      3,
      elm,
      'content',
      'attributes added',
      'attributes removed',
      false,
      0,
      undefined,
    );
    expect(spy).toHaveBeenNthCalledWith(4, elm, 'padding', true, false, false, 0, undefined);
    expect(spy).toHaveBeenNthCalledWith(5, elm, 'bold', 'true', 'false', false, 0, undefined);
    spy.mockReset();
    spy.mockRestore();
  });
});
