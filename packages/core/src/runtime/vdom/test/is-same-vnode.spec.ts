// import type * as d from '../declarations';
import { h } from '../h';
import { isSameVnode } from '../vdom-render';

describe('isSameVnode', () => {
  it('should not be same vnode with slot and no vnode2 name', () => {
    const vnode1 = h('slot', { name: 'start' }, '1');
    const vnode2 = h('slot', {}, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
  });

  it('should not be same vnode with slot and no vnode1 name', () => {
    const vnode1 = h('slot', {}, '1');
    const vnode2 = h('slot', { name: 'end' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
  });

  it('should not be same vnode with slot and different vname', () => {
    const vnode1 = h('slot', { name: 'start' }, '1');
    const vnode2 = h('slot', { name: 'end' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
  });

  it('should be same vnode with slot and same vname', () => {
    const vnode1 = h('slot', { name: 'start' }, '1');
    const vnode2 = h('slot', { name: 'start' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(true);
  });

  it('should be same vnode with slot and no vname', () => {
    const vnode1 = h('slot', {}, '1');
    const vnode2 = h('slot', {}, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(true);
  });

  it('should not be same vnode with same tag and different key', () => {
    const vnode1 = h('a', { attr: '1', key: 'mykey1' }, '1');
    const vnode2 = h('a', { attr: '2', key: 'mykey2' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
  });

  it('should not be same vnode with different tag and same key', () => {
    const vnode1 = h('a', { attr: '1', key: 'mykey' }, '1');
    const vnode2 = h('b', { attr: '2', key: 'mykey' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
  });

  it('should not be same vnode with different tag and no key', () => {
    const vnode1 = h('a', null, '1');
    const vnode2 = h('b', null, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
  });

  it('should be same vnode with same tag and same key', () => {
    const vnode1 = h('a', { attr: '1', key: 'mykey' }, '1');
    const vnode2 = h('a', { attr: '2', key: 'mykey' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(true);
  });

  it('should be same vnode with same tag and defined data, but no key', () => {
    const vnode1 = h('a', { attr: '1' }, '1');
    const vnode2 = h('a', { attr: '2' }, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(true);
  });

  it('should be same vnode with same tag and undefined data', () => {
    const vnode1 = h('a', null, '1');
    const vnode2 = h('a', null, '2');
    expect(isSameVnode(vnode1, vnode2)).toBe(true);
  });
});
