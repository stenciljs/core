import type * as d from '../../../declarations';
import { h, newVNode } from '../h';

describe('h()', () => {
  it('should render nested functional components', () => {
    const FunctionalCmp1 = () => h('fn-cmp', null);
    const FunctionalCmp2 = () => h(FunctionalCmp1, null);
    const vnode = h(FunctionalCmp2, null);
    expect(vnode.$tag$).toEqual('fn-cmp');
  });

  it('should render functional component', () => {
    const FunctionalCmp = () => h('fn-cmp', null);
    const vnode = h(FunctionalCmp, null);
    expect(vnode.$tag$).toEqual('fn-cmp');
  });

  it('should get vnode with only tag string', () => {
    const vnode = h('div', null);
    expect(vnode.$tag$).toEqual('div');
  });

  it('should get vnode with tag and data', () => {
    const vnode = h('div', { id: 'my-id' });
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$attrs$.id).toBe('my-id');
  });

  it('should get vnode with tag and child text', () => {
    const vnode = h('div', null, 'child text');
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$text$).toBe('child text');
  });

  it('should get vnode with tag and multiple child text', () => {
    const vnode = h('div', null, 'child 1', 'child 2');
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$text$).toBe('child 1child 2');
  });

  it('should get vnode with tag and child number', () => {
    const vnode = h('div', null, 0);
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$text$).toBe('0');
  });

  it('should get vnode with tag with multiple child h()', () => {
    const vnode = h('div', null, h('child-a', null), h('child-b', null));
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(2);
    expect(vnode.$children$[0].$tag$).toBe('child-a');
    expect(vnode.$children$[1].$tag$).toBe('child-b');
  });

  it('should get vnode with tag with one child h()', () => {
    const vnode = h('parent', null, h('child', null));
    expect(vnode.$tag$).toEqual('parent');
    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(1);
    expect(vnode.$children$[0].$tag$).toBe('child');
  });

  it('should get vnode with tag with two child h()', () => {
    const vnode = h('parent', null, h('child-a', null), h('child-b', null));
    expect(vnode.$tag$).toEqual('parent');
    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(2);
    expect(vnode.$children$[0].$tag$).toBe('child-a');
    expect(vnode.$children$[1].$tag$).toBe('child-b');
  });

  it('should get vnode with tag, data, child text', () => {
    const vnode = h('div', { id: 'my-id' }, 'child text');
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$children$[0].$text$).toBe('child text');
  });

  it('should get vnode with tag, data, child number', () => {
    const vnode = h('div', { id: 'my-id' }, 0);
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$children$[0].$text$).toBe('0');
  });

  it('should get vnode with tag, data, one child h()', () => {
    const vnode = h('div', { id: 'my-id' }, h('child-a', null));
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(1);
    expect(vnode.$children$[0].$tag$).toBe('child-a');
  });

  it('should get vnode with tag, data, array of children h()', () => {
    const vnode = h('div', { id: 'my-id' }, h('child-a', null), h('child-b', null));
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$children$).toBeDefined();
    expect(vnode.$children$.length).toBe(2);
    expect(vnode.$children$[0].$tag$).toBe('child-a');
    expect(vnode.$children$[1].$tag$).toBe('child-b');
  });

  it('should have class exactly as passed if string w/ extra whitespace', () => {
    const vnode = h('div', { class: '  dragons   love  tacos  ' });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('  dragons   love  tacos  ');
  });

  it('should have class exactly as passed if string w/ duplicates', () => {
    const vnode = h('div', { class: 'middle aligned center aligned' });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('middle aligned center aligned');
  });

  it('should have class based on classes as keys of an object', () => {
    const vnode = h('div', { class: { dragons: true, love: true, tacos: true } });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('dragons love tacos');
  });

  it('should set vkey', () => {
    const vnode = h('div', { key: 'my-key' });
    expect(vnode.$key$).toBe('my-key');
  });

  it('should set vkey to null when key is undefined', () => {
    const vnode = h('div', { key: undefined });
    expect(vnode.$key$).toBe(null);
  });

  it('should set vkey to null when key is null', () => {
    const vnode = h('div', { key: null });
    expect(vnode.$key$).toBe(null);
  });

  it('should set vkey to undefined when we have data, but no key', () => {
    const vnode = h('div', { some: 'data' });
    expect(vnode.$key$).toBe(null);
  });

  it('should set vkey to undefined when no data', () => {
    const vnode = h('div', null);
    expect(vnode.$key$).toBe(null);
  });

  it('should set vattrs ref', () => {
    const ref = () => {
      /**/
    };
    const vnode = h('div', { ref: ref });
    expect(vnode.$attrs$.ref).toBe(ref);
  });

  it('should not set vref', () => {
    const vnode = h('div', {});
    expect(vnode.$attrs$.ref).toBeUndefined();
  });

  it('should add one class from string', () => {
    const vnode = h('div', { class: 'some-class and another-class' });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('some-class and another-class');
  });

  it('should add class from map of classnames and booleans', () => {
    const vnode = h('div', { class: { enabled: true, checked: false } });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('enabled');
  });

  it('should add class from className string', () => {
    const vnode = h('div', { className: 'one point twenty-one gigawatts' });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('one point twenty-one gigawatts');
  });

  it('should add class from className map of classnames and booleans', () => {
    const vnode = h('div', { className: { save: true, the: true, clock: true, tower: true, hillvalley: false } });
    expect(vnode.$attrs$.class).toBeDefined();
    expect(vnode.$attrs$.class).toEqual('save the clock tower');
  });

  it('should add props', () => {
    const vnode = h('div', { id: 'my-id', checked: false, count: 0 });
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$attrs$.id).toBe('my-id');
    expect(vnode.$attrs$.checked).toBe(false);
    expect(vnode.$attrs$.count).toBe(0);
  });

  it('should add attrs', () => {
    const vnode = h('div', { id: 'my-id', checked: false, count: 0 });
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$attrs$.id).toBe('my-id');
    expect(vnode.$attrs$.checked).toBe(false);
    expect(vnode.$attrs$.count).toBe(0);
  });

  it('should add on', () => {
    function onClick() {
      /**/
    }
    const vnode = h('div', { onclick: onClick });
    expect(vnode.$attrs$).toBeDefined();
    expect(vnode.$attrs$.onclick).toBe(onClick);
  });

  it('should add style', () => {
    const vnode = h('div', { style: { marginLeft: '10px' } });
    expect(vnode.$attrs$.style).toBeDefined();
    expect(vnode.$attrs$.style.marginLeft).toBe('10px');
  });

  it('should add key string', () => {
    const vnode = h('div', { key: 'my-key' });
    expect(vnode.$key$).toBe('my-key');
  });

  it('should add key number', () => {
    const vnode = h('div', { key: 88 });
    expect(vnode.$key$).toBe(88);
  });

  it('can create vnode with proper tag', () => {
    expect(h('div', null).$tag$).toEqual('div');
    expect(h('a', null).$tag$).toEqual('a');
  });

  it('can create vnode with children', () => {
    const vnode = h('div', null, h('span', null), h('b', null));
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$tag$).toEqual('span');
    expect(vnode.$children$[1].$tag$).toEqual('b');
  });

  it('can create vnode with one child vnode', () => {
    const vnode = h('div', null, h('span', null));
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$tag$).toEqual('span');
  });

  it('can create vnode with no props and one child vnode', () => {
    const vnode = h('div', null, h('span', null));
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$tag$).toEqual('span');
  });

  it('can create vnode text with dynamic string', () => {
    const val = 'jazzhands';
    const vnode = h('div', null, val);
    expect(vnode.$tag$).toEqual('div');
    expect(vnode.$children$[0].$text$).toEqual('jazzhands');
  });

  it('can create vnode with text content in string', () => {
    const vnode = h('a', null, 'I am a string');
    expect(vnode.$children$[0].$text$).toEqual('I am a string');
  });

  it('should merge all simple children', () => {
    const vnode = h('a', null, 'Str0', [12, ['Str2']] as any);
    expect(vnode.$children$.length).toBe(1);
    expect(vnode.$children$[0].$text$).toEqual('Str012Str2');
  });

  it('should not render booleans', () => {
    const vnode = h('a', null, [false, true] as any);
    expect(vnode.$children$).toBe(null);
  });

  it('should not render null and undefined', () => {
    const vnode = h('a', null, [null, undefined] as any);
    expect(vnode.$children$).toBe(null);
  });

  it('should merge with booleans around', () => {
    const vnode = h('a', null, [false, 'one', true] as any, 'word');
    expect(vnode.$children$.length).toBe(1);
    expect(vnode.$children$[0].$text$).toBe('oneword');
  });

  it('should walk nested arrays', () => {
    const vnode = h('a', null, ['Str0', [h('b', null, 'Str1'), ['Str2']]] as any);

    expect(vnode.$children$).toEqual([
      newVNode(null, 'Str0'),
      {
        $attrs$: null,
        $children$: [newVNode(null, 'Str1')],
        $elm$: null,
        $flags$: 0,
        $key$: null,
        $name$: null,
        $tag$: 'b',
        $text$: null,
      },
      newVNode(null, 'Str2'),
    ]);
  });

  describe('functional components', () => {
    it('should receive props, array, and utils as props', async () => {
      let args: any;
      const MyFunction: d.FunctionalComponent = (...argArray) => {
        args = argArray;
        return null;
      };
      h(MyFunction, { id: 'blank' }, h('span', {}));
      expect(args.length).toBe(3);
      expect(args[0]).toEqual({ id: 'blank' });
      expect(args[1].length).toEqual(1);
      expect(typeof args[2].map).toBe('function');
      expect(typeof args[2].forEach).toBe('function');
    });

    it('should receive an empty object when component receives no props', async () => {
      let args: any;
      const MyFunction: d.FunctionalComponent = (...argArray) => {
        args = argArray;
        return null;
      };
      h(MyFunction, {});
      expect(args[0]).toEqual({});
      expect(args[1]).toEqual([]);
    });

    it('should receive an empty array when component receives no children', async () => {
      let args: any;
      const MyFunction: d.FunctionalComponent = (...argArray) => {
        args = argArray;
        return null;
      };
      h(MyFunction, {});
      expect(args[1]).toEqual([]);
    });

    it('should handle functional cmp which returns null', async () => {
      const MyFunction: d.FunctionalComponent = () => {
        return null;
      };
      const vnode = h(MyFunction, {});

      expect(vnode).toEqual(null);
    });

    it('should render functional cmp content', async () => {
      const MyFunction: d.FunctionalComponent = () => {
        return h('div', { id: 'fn-cmp' }, 'fn-cmp');
      };
      const vnode = h(MyFunction, {});
      expect(vnode).toEqual({
        $elm$: null,
        $flags$: 0,
        $attrs$: { id: 'fn-cmp' },
        $children$: [newVNode(null, 'fn-cmp')],
        $key$: null,
        $name$: null,
        $tag$: 'div',
        $text$: null,
      });
    });
  });

  describe('VDom Util methods', () => {
    it('utils.forEach should loop over items and get the ChildNode data', () => {
      const output: any = [];
      const FunctionalCmp: d.FunctionalComponent = (_nodeData, children, util) => {
        util.forEach(children, (element) => {
          output.push(element);
          util.forEach(element.vchildren, (el) => {
            output.push(el);
          });
        });
        return h('article', null);
      };
      h(FunctionalCmp, null, h('div', { id: 'blue' }, h('span', null)));
      expect(output).toEqual([
        {
          vattrs: {
            id: 'blue',
          },
          vchildren: [
            {
              $elm$: null,
              $flags$: 0,
              $attrs$: null,
              $children$: null,
              $key$: null,
              $name$: null,
              $tag$: 'span',
              $text$: null,
            },
          ],
          vkey: null,
          vname: null,
          vtag: 'div',
          vtext: null,
        },
        {
          vattrs: null,
          vchildren: null,
          vkey: null,
          vname: null,
          vtag: 'span',
          vtext: null,
        },
      ]);
    });

    it('replaceAttributes should return the attributes for the node', () => {
      const FunctionalCmp: d.FunctionalComponent = (_nodeData, children, util) => {
        return util.map(children, (child) => {
          return {
            ...child,
            vattrs: {
              ...child.vattrs,
              class: 'my-class',
            },
          };
        });
      };
      const vnode = h(FunctionalCmp, null, h('div', { id: 'blue' }, 'innerText'), h('span', null));
      expect(vnode).toEqual([
        {
          $elm$: null,
          $flags$: 0,
          $attrs$: {
            class: 'my-class',
            id: 'blue',
          },
          $children$: [newVNode(null, 'innerText')],
          $key$: null,
          $name$: null,
          $tag$: 'div',
          $text$: null,
        },
        {
          $elm$: null,
          $flags$: 0,
          $attrs$: {
            class: 'my-class',
          },
          $children$: null,
          $key$: null,
          $name$: null,
          $tag$: 'span',
          $text$: null,
        },
      ]);
    });

    it('changing the vtag to a functional component should expand the component', () => {
      const ReplacementCmp: d.FunctionalComponent = (nodeData, children) => {
        return h('article', nodeData, h('p', null, ...children));
      };
      const FunctionalCmp: d.FunctionalComponent = (_nodeData, children, util) => {
        return util.map(children, (child) => {
          return {
            ...child,
            vtag: child.vtag === 'div' ? ReplacementCmp : child.vtag,
          };
        });
      };
      const vnode = h(FunctionalCmp, null, h('div', { id: 'blue' }, 'innerText'), h('span', null));

      expect(vnode).toEqual([
        {
          $flags$: 0,
          $tag$: 'article',
          $text$: null,
          $elm$: null,
          $children$: [
            {
              $flags$: 0,
              $tag$: 'p',
              $text$: null,
              $elm$: null,
              $children$: [newVNode(null, 'innerText')],
              $attrs$: null,
              $key$: null,
              $name$: null,
            },
          ],
          $attrs$: { id: 'blue' },
          $key$: null,
          $name$: null,
        },
        {
          $flags$: 0,
          $tag$: 'span',
          $text$: null,
          $elm$: null,
          $children$: null,
          $attrs$: null,
          $key$: null,
          $name$: null,
        },
      ]);
    });
  });
});
