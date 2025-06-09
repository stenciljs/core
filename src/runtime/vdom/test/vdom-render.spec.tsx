import { isSameVnode } from '../vdom-render';

describe('isSameVnode', () => {
  it('should detect objectively same nodes', () => {
    const vnode1: any = {
      $tag$: 'div',
      $key$: '1',
      $elm$: { nodeType: 9 },
    };
    const vnode2: any = {
      $tag$: 'div',
      $key$: '1',
      $elm$: { nodeType: 9 },
    };
    const vnode3: any = {
      $tag$: 'slot',
      $key$: '1',
      $name$: 'my-slot',
      $elm$: { nodeType: 9 },
    };
    const vnode4: any = {
      $tag$: 'slot',
      $name$: 'my-slot',
      $elm$: { nodeType: 9 },
    };
    expect(isSameVnode(vnode1, vnode2)).toBe(true);
    expect(isSameVnode(vnode3, vnode4)).toBe(true);
  });

  it('should add key to old node (e.g. via hydration) on init', () => {
    const vnode1: any = {
      $tag$: 'div',
      $elm$: { nodeType: 9 },
    };
    const vnode2: any = {
      $tag$: 'div',
      $key$: '1',
      $elm$: { nodeType: 9 },
    };
    expect(isSameVnode(vnode1, vnode2)).toBe(false);
    expect(isSameVnode(vnode1, vnode2, true)).toBe(true);
    expect(vnode1.$key$).toBe('1');
  });
});
