import { BUILD } from '@app-data';
import { Component } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { jsx, jsxs } from '../jsx-runtime';
import { jsxDEV } from '../jsx-dev-runtime';

describe('jsx-runtime', () => {
  describe('jsx() and jsxs()', () => {
    it('should create a vnode with no props', () => {
      const vnode = jsx('div', {});
      expect(vnode.$tag$).toBe('div');
      expect(vnode.$attrs$).toBe(null);
    });

    it('should create a vnode with basic props', () => {
      const vnode = jsx('div', { id: 'test', class: 'foo' });
      expect(vnode.$tag$).toBe('div');
      expect(vnode.$attrs$).toEqual({ id: 'test', class: 'foo' });
    });

    it('should handle key passed as separate parameter', () => {
      const vnode = jsx('div', { id: 'test' }, 'my-key');
      expect(vnode.$tag$).toBe('div');
      if (BUILD.vdomKey) {
        expect(vnode.$key$).toBe('my-key');
      }
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'my-key' });
    });

    it('should handle key passed in props', () => {
      const vnode = jsx('div', { id: 'test', key: 'props-key' });
      expect(vnode.$tag$).toBe('div');
      if (BUILD.vdomKey) {
        expect(vnode.$key$).toBe('props-key');
      }
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'props-key' });
    });

    it('should prefer key from props over parameter', () => {
      const vnode = jsx('div', { id: 'test', key: 'props-key' }, 'param-key');
      expect(vnode.$tag$).toBe('div');
      if (BUILD.vdomKey) {
        expect(vnode.$key$).toBe('props-key');
      }
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'props-key' });
    });

    it('should handle ref in props', () => {
      const refCallback = jest.fn();
      const vnode = jsx('div', { id: 'test', ref: refCallback });
      expect(vnode.$tag$).toBe('div');
      expect(vnode.$attrs$).toEqual({ id: 'test', ref: refCallback });
    });

    it('should handle both key and ref', () => {
      const refCallback = jest.fn();
      const vnode = jsx('div', { id: 'test', key: 'my-key', ref: refCallback }, undefined);
      expect(vnode.$tag$).toBe('div');
      if (BUILD.vdomKey) {
        expect(vnode.$key$).toBe('my-key');
      }
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'my-key', ref: refCallback });
    });

    it('should handle children as array', () => {
      const vnode = jsx('div', { children: ['Hello', 'World'] });
      expect(vnode.$tag$).toBe('div');
      expect(vnode.$children$?.length).toBe(2);
    });

    it('should handle single child', () => {
      const vnode = jsx('div', { children: 'Hello' });
      expect(vnode.$tag$).toBe('div');
      expect(vnode.$children$?.length).toBe(1);
    });

    it('should not include children in attrs', () => {
      const vnode = jsx('div', { id: 'test', children: 'Hello' });
      expect(vnode.$attrs$).toEqual({ id: 'test' });
    });

    it('jsxs should work the same as jsx', () => {
      const vnode = jsxs('div', { id: 'test' }, 'my-key');
      expect(vnode.$tag$).toBe('div');
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'my-key' });
    });
  });

  describe('jsxDEV()', () => {
    it('should handle key and ref like jsx()', () => {
      const refCallback = jest.fn();
      const vnode = jsxDEV('div', { id: 'test', key: 'my-key', ref: refCallback });
      expect(vnode.$tag$).toBe('div');
      if (BUILD.vdomKey) {
        expect(vnode.$key$).toBe('my-key');
      }
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'my-key', ref: refCallback });
    });

    it('should handle key as separate parameter', () => {
      const vnode = jsxDEV('div', { id: 'test' }, 'param-key');
      expect(vnode.$tag$).toBe('div');
      if (BUILD.vdomKey) {
        expect(vnode.$key$).toBe('param-key');
      }
      expect(vnode.$attrs$).toEqual({ id: 'test', key: 'param-key' });
    });
  });

  describe('DOM rendering integration', () => {
    it('key should not appear as DOM attribute', async () => {
      @Component({ tag: 'jsx-test-key' })
      class JsxTestKey {
        render() {
          // Using jsx() directly to simulate jsxImportSource behavior
          return jsx('div', { id: 'test-div', key: 'my-key', children: 'Hello' });
        }
      }

      const { root } = await newSpecPage({
        components: [JsxTestKey],
        html: '<jsx-test-key></jsx-test-key>',
      });

      const div = root.querySelector('#test-div');
      expect(div).not.toBeNull();
      expect(div.getAttribute('key')).toBeNull();
      expect(div.getAttribute('id')).toBe('test-div');
      expect(div.textContent).toBe('Hello');
    });

    it('ref should not appear as DOM attribute but callback should be called', async () => {
      let refElement: HTMLDivElement | null = null;

      @Component({ tag: 'jsx-test-ref' })
      class JsxTestRef {
        render() {
          return jsx('div', {
            id: 'test-div',
            ref: (el: any) => {
              refElement = el;
            },
            children: 'Hello',
          });
        }
      }

      const { root } = await newSpecPage({
        components: [JsxTestRef],
        html: '<jsx-test-ref></jsx-test-ref>',
      });

      const div = root.querySelector('#test-div');
      expect(div).not.toBeNull();
      expect(div.getAttribute('ref')).toBeNull();
      expect(refElement).toBe(div);
    });

    it('key and ref should both work together without appearing in DOM', async () => {
      let refElement: HTMLDivElement | null = null;

      @Component({ tag: 'jsx-test-both' })
      class JsxTestBoth {
        render() {
          return jsx('div', {
            id: 'test-div',
            key: 'unique-key',
            ref: (el: any) => {
              refElement = el;
            },
            children: 'Hello',
          });
        }
      }

      const { root } = await newSpecPage({
        components: [JsxTestBoth],
        html: '<jsx-test-both></jsx-test-both>',
      });

      const div = root.querySelector('#test-div');
      expect(div).not.toBeNull();
      expect(div.getAttribute('key')).toBeNull();
      expect(div.getAttribute('ref')).toBeNull();
      expect(div.getAttribute('id')).toBe('test-div');
      expect(refElement).toBe(div);
    });
  });
});
