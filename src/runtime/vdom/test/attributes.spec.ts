import { SVG_NS, XLINK_NS } from '@utils';

import type * as d from '../../../declarations';
import { h, newVNode } from '../h';
import { patch } from '../vdom-render';

describe('attributes', () => {
  let hostElm: d.HostElement;
  let vnode0: d.VNode;

  beforeEach(() => {
    hostElm = document.createElement('div');
    vnode0 = newVNode(null, null);
    vnode0.$elm$ = hostElm;
  });

  it('have their provided values', () => {
    const vnode1 = h('div', { href: '/foo', minlength: 1, value: true });
    patch(vnode0, vnode1);

    expect(hostElm.getAttribute('href')).toEqual('/foo');
    expect(hostElm.getAttribute('minlength')).toEqual('1');
    expect(hostElm.getAttribute('value')).toEqual('');
  });

  it('are not omitted when falsy values are provided', () => {
    const vnode1 = h('div', { href: null, minlength: 0, value: false });
    patch(vnode0, vnode1);
    expect(hostElm.getAttribute('href')).toEqual(null);
    expect(hostElm.getAttribute('minlength')).toEqual('0');
    expect(hostElm.getAttribute('value')).toEqual(null);
  });

  it('are set correctly when namespaced', () => {
    const vnode1 = h('svg', { 'xlink:href': '#foo' });
    patch(vnode0, vnode1);
    expect(hostElm.getAttributeNS(XLINK_NS, 'href')).toEqual('#foo');
  });

  it('are set correctly when namespaced (2)', () => {
    const vnode1 = h('svg', { xlinkHref: '#foo' });
    patch(vnode0, vnode1);
    expect(hostElm.getAttributeNS(XLINK_NS, 'href')).toEqual('#foo');
  });

  it('should not touch class nor id fields', () => {
    hostElm = document.createElement('div');
    hostElm.id = 'myId';
    hostElm.className = 'myClass';
    vnode0.$elm$ = hostElm;
    const vnode1 = h('div', null, 'Hello');
    patch(vnode0, vnode1);
    expect(hostElm.tagName).toEqual('DIV');
    expect(hostElm.id).toEqual('myId');
    expect(hostElm.className).toEqual('myClass');
    expect(hostElm.textContent).toEqual('Hello');
  });

  describe('boolean attribute', () => {
    it('is present if the value is truthy', () => {
      const vnode1 = h('div', { required: true, readonly: 1, noresize: 'truthy' });
      patch(vnode0, vnode1);
      expect(hostElm.hasAttribute('required')).toEqual(true);
      expect(hostElm.getAttribute('required')).toEqual('');
      expect(hostElm.hasAttribute('readonly')).toEqual(true);
      expect(hostElm.getAttribute('readonly')).toEqual('1');
      expect(hostElm.hasAttribute('noresize')).toEqual(true);
      expect(hostElm.getAttribute('noresize')).toEqual('truthy');
    });

    it('is omitted if the value is falsy', () => {
      const vnode1 = h('div', { required: false, readonly: 'false', noresize: null });
      patch(vnode0, vnode1);
      expect(hostElm.getAttribute('required')).toEqual(null);
      expect(hostElm.getAttribute('readonly')).toEqual('false');
      expect(hostElm.getAttribute('noresize')).toEqual(null);
    });
  });

  describe('svg', function () {
    it('adds correctly xlink namespaced attribute', () => {
      const testUrl = '/test';
      const vnode1 = h(
        'svg',
        {},
        h('div', {
          'xlink:href': testUrl,
        }),
      );

      hostElm = document.createElementNS(SVG_NS, 'svg') as any;
      vnode0.$elm$ = hostElm;
      patch(vnode0, vnode1);
      expect(hostElm.childNodes.length).toEqual(1);
      expect(hostElm.children[0].getAttribute('href')).toEqual(testUrl);
      expect(hostElm.children[0].getAttributeNS(XLINK_NS, 'href')).toEqual(testUrl);
    });
  });
});
