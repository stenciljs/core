import { toVNode } from '../util';

describe('toVNode()', () => {
  it('should create element w/ child elements and text nodes', () => {
    const elm = document.createElement('h1');
    elm.innerHTML = '<div> 1 <span> 2 </span><!--comment-->   </div>';

    const vnode = toVNode(elm);

    expect(vnode.$elm$).toBe(elm);
    expect(vnode.$tag$).toBe('h1');

    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(1);

    expect(vnode.$children$[0].$tag$).toBe('div');

    expect(vnode.$children$[0].$children$).toBeDefined();
    expect(vnode.$children$[0].$children$.length).toBe(3);

    expect(vnode.$children$[0].$children$[0].$text$).toBe(' 1 ');

    expect(vnode.$children$[0].$children$[1].$tag$).toBe('span');
    expect(vnode.$children$[0].$children$[2].$text$).toBe('   ');

    expect(vnode.$children$[0].$children$[1].$children$[0].$text$).toBe(' 2 ');
  });

  it('should create element w/ child text node', () => {
    const elm = document.createElement('h1');
    elm.textContent = '88mph';
    const vnode = toVNode(elm);
    expect(vnode.$elm$).toBe(elm);
    expect(vnode.$tag$).toBe('h1');
    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(1);
    expect(vnode.$children$[0].$text$).toBe('88mph');
  });

  it('should create element', () => {
    const elm = document.createElement('h1');
    const vnode = toVNode(elm);
    expect(vnode.$elm$).toBe(elm);
    expect(vnode.$tag$).toBe('h1');
    expect(vnode.$children$).toBeNull();
  });
});
