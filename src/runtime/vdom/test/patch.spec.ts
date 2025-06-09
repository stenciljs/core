import { shuffleArray } from '@stencil/core/testing';
import { SVG_NS } from '@utils';

import type * as d from '../../../declarations';
import { h, newVNode } from '../h';
import { toVNode } from '../util';
import { patch } from '../vdom-render';

describe('renderer', () => {
  let hostElm: any;
  let vnode0: d.VNode;
  const inner = prop('innerHTML');

  beforeEach(() => {
    hostElm = document.createElement('div');
    vnode0 = newVNode(null, null);
    vnode0.$elm$ = hostElm;
  });

  describe('functional component', () => {
    it('should re-render functional component w/ children', () => {
      const DoesNotRenderChildren = () => h('div', null, 'mph');
      const RendersChildren = (_props: any, children: any) => h('div', null, children, '-12');

      hostElm = document.createElement('my-tag');

      const vnode0 = newVNode(null, null);
      vnode0.$elm$ = hostElm;

      const vnode1 = h('my-tag', null, h(DoesNotRenderChildren, null, '88'), h(RendersChildren, null, 'DMC'));

      patch(vnode0, vnode1);
      expect(hostElm.tagName).toBe('MY-TAG');
      expect(hostElm.childNodes[0].innerHTML).toBe('mph');
      expect(hostElm.childNodes[1].innerHTML).toBe('DMC-12');

      const vnode2 = h('my-tag', null, h(DoesNotRenderChildren, null, '88'), h(RendersChildren, null, 'dmc'));

      patch(vnode1, vnode2);
      expect(hostElm.childNodes[0].innerHTML).toBe('mph');
      expect(hostElm.childNodes[1].innerHTML).toBe('dmc-12');
    });

    it('should re-render a functional component', () => {
      function functionalComp({ children, ...props }: any) {
        return h('span', props, children);
      }

      hostElm = document.createElement('my-tag');

      const vnode0 = newVNode(null, null);
      vnode0.$elm$ = hostElm;

      const vnode1 = h('my-tag', null, h(functionalComp, { class: 'render-one' }));

      patch(vnode0, vnode1);
      expect(hostElm.childNodes[0].className).toBe('render-one');

      const vnode2 = h('my-tag', null, h(functionalComp, { class: 'render-two' }));

      patch(vnode1, vnode2);
      expect(hostElm.childNodes[0].className).toBe('render-two');
    });

    it('should render a basic functional component', () => {
      function functionalComp({ children, ...props }: any) {
        return h('span', props, children);
      }

      hostElm = document.createElement('my-tag');
      vnode0 = newVNode(null, null);
      vnode0.$elm$ = hostElm;
      patch(vnode0, h('my-tag', null, h(functionalComp, { class: 'functional-cmp' })));
      expect(hostElm.childNodes[0].tagName).toBe('SPAN');
      expect(hostElm.childNodes[0].textContent).toBe('');
      expect(hostElm.childNodes[0].className).toBe('functional-cmp');
    });

    it('should render as a sibling component', () => {
      function functionalComp(props: any, children: any) {
        return h('span', props, children);
      }

      hostElm = document.createElement('my-tag');
      vnode0 = newVNode(null, null);
      vnode0.$elm$ = hostElm;
      patch(vnode0, h('my-tag', null, h('span', null, 'Test Child'), h(functionalComp, { class: 'functional-cmp' })));
      expect(hostElm.childNodes[0].tagName).toBe('SPAN');
      expect(hostElm.childNodes[0].textContent).toBe('Test Child');
      expect(hostElm.childNodes[1].tagName).toBe('SPAN');
      expect(hostElm.childNodes[1].textContent).toBe('');
      expect(hostElm.childNodes[1].className).toBe('functional-cmp');
    });

    it('should render children', () => {
      function functionalComp(props: any, children: any) {
        return h('span', props, children);
      }

      hostElm = document.createElement('my-tag');
      vnode0 = newVNode(null, null);
      vnode0.$elm$ = hostElm;
      patch(vnode0, h('my-tag', null, h(functionalComp, { class: 'functional-cmp' }, h('span', null, 'Test Child'))));
      expect(hostElm.childNodes[0].tagName).toBe('SPAN');
      expect(hostElm.childNodes[0].className).toBe('functional-cmp');
      expect(hostElm.childNodes[0].textContent).toBe('Test Child');
    });
  });

  describe('created element', () => {
    it('has tag', () => {
      patch(vnode0, h('div', null));
      expect(hostElm.tagName).toEqual('DIV');
    });

    it('receives css classes', () => {
      const vnode1 = h('div', null, h('i', { class: { i: true, am: true, a: true, class: true } }));
      patch(vnode0, vnode1);
      expect(hostElm.firstChild).toHaveClasses(['i', 'am', 'a', 'class']);
    });

    it('can create elements with text content', () => {
      patch(vnode0, h('div', null, 'I am a string'));
      expect(hostElm.innerHTML).toEqual('I am a string');
    });
  });

  describe('patching an element', () => {
    it('does not remove classes of previous from dom if vdom does not document them', () => {
      hostElm.classList.add('horse');
      const vnode1 = h('i', { class: { i: true, am: true } });
      patch(vnode0, vnode1);

      expect(hostElm).toHaveClasses(['i', 'am', 'horse']);
    });

    it('changes elements classes from previous vnode', () => {
      const vnode1 = h('i', { class: { i: true, am: true, horse: true } });
      const vnode2 = h('i', { class: { i: true, am: true, horse: false } });
      patch(vnode0, vnode1);
      patch(vnode1, vnode2);

      expect(hostElm).toHaveClasses(['i', 'am']);
    });

    it('preserves memoized classes', () => {
      const cachedClass = { i: true, am: true, horse: false };
      const vnode1 = h('i', { class: cachedClass });
      const vnode2 = h('i', { class: cachedClass });
      patch(vnode0, vnode1);
      expect(hostElm).toHaveClasses(['i', 'am']);

      patch(vnode1, vnode2);
      expect(hostElm).toHaveClasses(['i', 'am']);
    });

    it('removes missing classes', () => {
      const vnode1 = h('i', { class: { i: true, am: true, horse: true } });
      const vnode2 = h('i', { class: { i: true, am: true } });
      patch(vnode0, vnode1);
      patch(vnode1, vnode2);
      expect(hostElm).toHaveClasses(['i', 'am']);
    });

    it('removes classes when class set to empty string', () => {
      const vnode1 = h('i', { class: { i: true, am: true, horse: true } });
      const vnode2 = h('i', { class: '' });
      patch(vnode0, vnode1);
      patch(vnode1, vnode2);
      expect(hostElm).toHaveClasses([]);
    });

    describe('using toVNode()', () => {
      it('can remove previous children of the root element', () => {
        const h2 = document.createElement('h2');
        h2.textContent = 'Hello';

        const prevElm = document.createElement('div');
        prevElm.id = 'id';
        prevElm.className = 'class';
        prevElm.appendChild(h2);

        const nextVNode = h('div', null, h('span', null, 'Hi'));
        patch(toVNode(prevElm), nextVNode);
        hostElm = nextVNode.$elm$;

        expect(hostElm).toEqual(prevElm);
        expect(hostElm.tagName).toEqual('DIV');
        expect(hostElm.id).toEqual('id');
        expect(hostElm.className).toEqual('class');
        expect(hostElm.childNodes.length).toEqual(1);
        expect(hostElm.childNodes[0].tagName).toEqual('SPAN');
        expect(hostElm.childNodes[0].textContent).toEqual('Hi');
      });

      it('can remove previous children of the root element with update', () => {
        const h2 = document.createElement('h2');
        h2.textContent = 'Hello';

        const prevElm = document.createElement('div');
        prevElm.id = 'id';
        prevElm.className = 'class';
        prevElm.appendChild(h2);

        const nextVNode = h('div', null, h('span', null, 'Hi'));
        patch(toVNode(prevElm), nextVNode);
        hostElm = nextVNode.$elm$;

        expect(hostElm).toEqual(prevElm);
        expect(hostElm.tagName).toEqual('DIV');
        expect(hostElm.id).toEqual('id');
        expect(hostElm.className).toEqual('class');
        expect(hostElm.childNodes.length).toEqual(1);
        expect(hostElm.childNodes[0].tagName).toEqual('SPAN');
        expect(hostElm.childNodes[0].textContent).toEqual('Hi');
      });

      it('can remove some children of the root element', () => {
        const h2 = document.createElement('h2');
        h2.textContent = 'Hello';

        const prevElm = document.createElement('div');
        prevElm.id = 'id';
        prevElm.className = 'class';

        const text = document.createTextNode('Foobar');
        (<any>text).testProperty = function () {
          /**/
        }; // ensures we don't recreate the Text Node
        prevElm.appendChild(text);
        prevElm.appendChild(h2);

        const nextVNode = h('div', null, 'Foobar');
        patch(toVNode(prevElm), nextVNode);
        hostElm = nextVNode.$elm$;

        expect(hostElm).toEqual(prevElm);
        expect(hostElm.tagName).toEqual('DIV');
        expect(hostElm.id).toEqual('id');
        expect(hostElm.className).toEqual('class');
        expect(hostElm.childNodes.length).toEqual(1);
        expect(hostElm.childNodes[0].nodeType).toEqual(3);
        expect(hostElm.childNodes[0].wholeText).toEqual('Foobar');
        expect(typeof hostElm.childNodes[0].testProperty).toEqual('function');
      });

      it('can remove text elements', () => {
        const h2 = document.createElement('h2');
        h2.textContent = 'Hello';

        const prevElm = document.createElement('div');
        prevElm.id = 'id';
        prevElm.className = 'class';

        const text = document.createTextNode('Foobar');
        prevElm.appendChild(text);
        prevElm.appendChild(h2);

        const nextVNode = h('div', null, h('h2', null, 'Hello'));
        patch(toVNode(prevElm), nextVNode);
        hostElm = nextVNode.$elm$;

        expect(hostElm).toEqual(prevElm);
        expect(hostElm.tagName).toEqual('DIV');
        expect(hostElm.id).toEqual('id');
        expect(hostElm.className).toEqual('class');
        expect(hostElm.childNodes.length).toEqual(1);
        expect(hostElm.childNodes[0].nodeType).toEqual(1);
        expect(hostElm.childNodes[0].textContent).toEqual('Hello');
      });
    });

    describe('updating children with keys', () => {
      function spanNum(n: any) {
        if (n == null) {
          return n;
        } else if (typeof n === 'string') {
          return h('span', null, n);
        } else {
          return h('span', { key: n }, n.toString());
        }
      }

      function vnodeMap(arr: number[]) {
        return h.apply(null, ['span', null, ...arr.map(spanNum)]);
      }

      describe('addition of elements', () => {
        it('appends elements', () => {
          const vnode1 = vnodeMap([1]);
          const vnode2 = vnodeMap([1, 2, 3]);

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(1);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(3);
          expect(hostElm.children[1].innerHTML).toEqual('2');
          expect(hostElm.children[2].innerHTML).toEqual('3');
        });

        it('prepends elements', () => {
          const vnode1 = vnodeMap([4, 5]);
          const vnode2 = vnodeMap([1, 2, 3, 4, 5]);

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(2);

          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3', '4', '5']);
        });

        it('add elements in the middle', () => {
          const vnode1 = vnodeMap([1, 2, 4, 5]);
          const vnode2 = vnodeMap([1, 2, 3, 4, 5]);

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(4);
          expect(hostElm.children.length).toEqual(4);

          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3', '4', '5']);
        });

        it('add elements at begin and end', () => {
          const vnode1 = vnodeMap([2, 3, 4]);
          const vnode2 = vnodeMap([1, 2, 3, 4, 5]);

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(3);

          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3', '4', '5']);
        });

        it('adds children to parent with no children', () => {
          const vnode1 = h('span', { key: 'span' });
          const vnode2 = h('span', { key: 'span' }, ...[1, 2, 3].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(0);

          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3']);
        });

        it('removes all children from parent', () => {
          const vnode1 = h('span', { key: 'span' }, ...[1, 2, 3].map(spanNum));
          const vnode2 = h('span', { key: 'span' });
          patch(vnode0, vnode1);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3']);
          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(0);
        });

        it('update one child with same key but different sel', () => {
          const vnode1 = h('span', { key: 'spans' }, ...[1, 2, 3].map(spanNum));
          const vnode2 = h('span', { key: 'span' }, ...[spanNum(1), h('i', { key: 2 }, '2'), spanNum(3)]);
          patch(vnode0, vnode1);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3']);
          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['1', '2', '3']);
          expect(hostElm.children.length).toEqual(3);
          expect(hostElm.children[1].tagName).toEqual('I');
        });
      });

      describe('removal of elements', () => {
        it('removes elements from the beginning', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4, 5].map(spanNum));
          const vnode2 = h('span', null, ...[3, 4, 5].map(spanNum));
          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(5);
          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['3', '4', '5']);
        });

        it('removes elements from the end', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4, 5].map(spanNum));
          const vnode2 = h('span', null, ...[1, 2, 3].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(5);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(3);

          expect(hostElm.children[0].innerHTML).toEqual('1');
          expect(hostElm.children[1].innerHTML).toEqual('2');
          expect(hostElm.children[2].innerHTML).toEqual('3');
        });

        it('removes elements from the middle', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4, 5].map(spanNum));
          const vnode2 = h('span', null, ...[1, 2, 4, 5].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(5);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(4);

          expect(hostElm.children[0].innerHTML).toEqual('1');
          expect(hostElm.children[1].innerHTML).toEqual('2');
          expect(hostElm.children[2].innerHTML).toEqual('4');
          expect(hostElm.children[3].innerHTML).toEqual('5');
        });

        it('removes child svg elements', () => {
          vnode0.$elm$ = document.createElement('svg') as any;

          const a = h('svg', { n: SVG_NS }, h('g', null), h('g', null));
          const b = h('svg', { n: SVG_NS }, h('g', null));

          patch(vnode0, a);
          const resultA = toVNode(vnode0.$elm$);
          expect(resultA.$elm$.childNodes.length).toEqual(2);

          patch(resultA, b);
          const resultB = toVNode(resultA.$elm$);
          expect(resultB.$elm$.childNodes.length).toEqual(1);
        });
      });

      describe('element reordering', () => {
        it('moves element forward', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4].map(spanNum));
          const vnode2 = h('span', null, ...[2, 3, 1, 4].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(4);

          (<any>hostElm.children[0]).instance = 1;
          (<any>hostElm.children[1]).instance = 2;
          (<any>hostElm.children[2]).instance = 3;
          (<any>hostElm.children[3]).instance = 4;

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(4);

          expect(hostElm.children[0].innerHTML).toEqual('2');
          expect(hostElm.children[0].instance).toEqual(2);
          expect(hostElm.children[0].hasAttribute('key')).toBe(false);

          expect(hostElm.children[1].innerHTML).toEqual('3');
          expect(hostElm.children[1].instance).toEqual(3);
          expect(hostElm.children[1].hasAttribute('key')).toBe(false);

          expect(hostElm.children[2].innerHTML).toEqual('1');
          expect(hostElm.children[2].instance).toEqual(1);
          expect(hostElm.children[2].hasAttribute('key')).toBe(false);

          expect(hostElm.children[3].innerHTML).toEqual('4');
          expect(hostElm.children[3].instance).toEqual(4);
          expect(hostElm.children[3].hasAttribute('key')).toBe(false);
        });

        it('moves element to end', () => {
          const vnode1 = h('span', null, ...[1, 2, 3].map(spanNum));
          const vnode2 = h('span', null, ...[2, 3, 1].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(3);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(3);
          expect(hostElm.children[0].innerHTML).toEqual('2');
          expect(hostElm.children[1].innerHTML).toEqual('3');
          expect(hostElm.children[2].innerHTML).toEqual('1');
        });

        it('moves element backwards', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4].map(spanNum));
          const vnode2 = h('span', null, ...[1, 4, 2, 3].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(4);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(4);
          expect(hostElm.children[0].innerHTML).toEqual('1');
          expect(hostElm.children[1].innerHTML).toEqual('4');
          expect(hostElm.children[2].innerHTML).toEqual('2');
          expect(hostElm.children[3].innerHTML).toEqual('3');
        });

        it('swaps first and last', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4].map(spanNum));
          const vnode2 = h('span', null, ...[4, 2, 3, 1].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(4);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(4);
          expect(hostElm.children[0].innerHTML).toEqual('4');
          expect(hostElm.children[1].innerHTML).toEqual('2');
          expect(hostElm.children[2].innerHTML).toEqual('3');
          expect(hostElm.children[3].innerHTML).toEqual('1');
        });
      });

      describe('combinations of additions, removals and reorderings', () => {
        it('move to left and replace', () => {
          const vnode1 = h('span', null, ...[1, 2, 3, 4, 5].map(spanNum));
          const vnode2 = h('span', null, ...[4, 1, 2, 3, 6].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(5);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(5);
          expect(hostElm.children[0].innerHTML).toEqual('4');
          expect(hostElm.children[1].innerHTML).toEqual('1');
          expect(hostElm.children[2].innerHTML).toEqual('2');
          expect(hostElm.children[3].innerHTML).toEqual('3');
          expect(hostElm.children[4].innerHTML).toEqual('6');
        });

        it('moves to left and leaves hole', () => {
          const vnode1 = h('span', null, ...[1, 4, 5].map(spanNum));
          const vnode2 = h('span', null, ...[4, 6].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(3);

          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(['4', '6']);
        });

        it('handles moved and set to undefined element ending at the end', () => {
          const vnode1 = h('span', null, ...[2, 4, 5].map(spanNum));
          const vnode2 = h('span', null, ...[4, 5, 3].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.children.length).toEqual(3);

          patch(vnode1, vnode2);
          expect(hostElm.children.length).toEqual(3);
          expect(hostElm.children[0].innerHTML).toEqual('4');
          expect(hostElm.children[1].innerHTML).toEqual('5');
          expect(hostElm.children[2].innerHTML).toEqual('3');
        });

        it('moves a key in non-keyed nodes with a size up', () => {
          const vnode1 = h('span', null, ...[1, 'a', 'b', 'c'].map(spanNum));
          const vnode2 = h('span', null, ...['d', 'a', 'b', 'c', 1, 'e'].map(spanNum));

          patch(vnode0, vnode1);
          expect(hostElm.childNodes.length).toEqual(4);
          expect(hostElm.textContent).toEqual('1abc');

          patch(vnode1, vnode2);
          expect(hostElm.childNodes.length).toEqual(6);
          expect(hostElm.textContent).toEqual('dabc1e');
        });
      });

      it('reverses elements', () => {
        const vnode1 = h('span', null, ...[1, 2, 3, 4, 5, 6, 7, 8].map(spanNum));
        const vnode2 = h('span', null, ...[8, 7, 6, 5, 4, 3, 2, 1].map(spanNum));

        patch(vnode0, vnode1);
        expect(hostElm.children.length).toEqual(8);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['8', '7', '6', '5', '4', '3', '2', '1']);
      });

      it('something', () => {
        const vnode1 = h('span', null, ...[0, 1, 2, 3, 4, 5].map(spanNum));
        const vnode2 = h('span', null, ...[4, 3, 2, 1, 5, 0].map(spanNum));

        patch(vnode0, vnode1);
        expect(hostElm.children.length).toEqual(6);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['4', '3', '2', '1', '5', '0']);
      });

      it('handles random shuffles', () => {
        let n: number, i: number;
        const arr = [],
          opacities: any[] = [],
          elms = 14,
          samples = 5;

        function spanNumWithOpacity(n: any, o: any) {
          return h('span', { key: n, style: { opacity: o } }, n.toString());
        }

        for (n = 0; n < elms; ++n) {
          arr[n] = n;
        }

        for (n = 0; n < samples; ++n) {
          const vnode1 = h(
            'span',
            null,
            ...arr.map(function (n) {
              return spanNumWithOpacity(n, '1');
            }),
          );

          const shufArr = shuffleArray(arr.slice(0));
          let elm: any = document.createElement('div');
          vnode0.$elm$ = elm;
          patch(vnode0, vnode1);
          elm = vnode1.$elm$;

          for (i = 0; i < elms; ++i) {
            expect(elm.children[i].innerHTML).toEqual(i.toString());
            opacities[i] = Math.random().toFixed(5).toString();
          }

          const vnode2 = h(
            'span',
            null,
            ...arr.map(function (n) {
              return spanNumWithOpacity(shufArr[n], opacities[n]);
            }),
          );

          patch(vnode1, vnode2);
          elm = vnode2.$elm$;
          for (i = 0; i < elms; ++i) {
            expect(elm.children[i].innerHTML).toEqual(shufArr[i].toString());
            expect(opacities[i].indexOf(elm.children[i].style.opacity)).toEqual(0);
          }
        }
      });

      it('supports null/undefined children', () => {
        const vnode1 = h('i', null, ...[0, 1, 2, 3, 4, 5].map(spanNum));
        const vnode2 = h('i', null, ...[null, 2, undefined, null, 1, 0, null, 5, 4, null, 3, undefined].map(spanNum));

        patch(vnode0, vnode1);
        expect(hostElm.children.length).toEqual(6);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['2', '1', '0', '5', '4', '3']);
      });

      it('supports all null/undefined children', () => {
        const vnode1 = h('v1', null, ...[0, 1, 2, 3, 4, 5].map(spanNum));
        const vnode2 = h('v2', null, ...[null, null, undefined, null, null, undefined]);
        const vnode3 = h('v3', null, ...[5, 4, 3, 2, 1, 0].map(spanNum));

        patch(vnode0, vnode1);

        patch(vnode1, vnode2);
        expect(hostElm.children.length).toEqual(0);

        patch(vnode2, vnode3);
        expect(map(inner, hostElm.children)).toEqual(['5', '4', '3', '2', '1', '0']);
      });

      it('handles random shuffles with null/undefined children', () => {
        let i, j, r, len, arr;
        const maxArrLen = 15,
          samples = 5;
        let vnode1 = vnode0,
          vnode2;

        for (i = 0; i < samples; ++i, vnode1 = vnode2) {
          len = Math.floor(Math.random() * maxArrLen);
          arr = [];

          for (j = 0; j < len; ++j) {
            if ((r = Math.random()) < 0.5) arr[j] = String(j);
            else if (r < 0.75) arr[j] = null;
            else arr[j] = undefined;
          }

          shuffleArray(arr);
          vnode2 = h('div', null, ...arr.map(spanNum));

          patch(vnode1, vnode2);
          expect(map(inner, hostElm.children)).toEqual(
            arr.filter(function (x) {
              return x != null;
            }),
          );
        }
      });
    });

    describe('updating children without keys', () => {
      it('appends elements', () => {
        const vnode1 = h('div', null, h('span', null, 'Hello'));
        const vnode2 = h('div', null, h('span', null, 'Hello'), h('span', null, 'World'));

        patch(vnode0, vnode1);
        expect(map(inner, hostElm.children)).toEqual(['Hello']);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['Hello', 'World']);
      });

      it('handles unmoved text nodes', () => {
        const vnode1 = h('div', null, ...['Text', h('span', null, 'Span')]);
        const vnode2 = h('div', null, ...['Text', h('span', null, 'Span')]);

        patch(vnode0, vnode1);
        expect(hostElm.childNodes[0].textContent).toEqual('Text');

        patch(vnode1, vnode2);
        expect(hostElm.childNodes[0].textContent).toEqual('Text');
      });

      it('handles changing text children', () => {
        const vnode1 = h('div', null, ...['Text', h('span', null, 'Span')]);
        const vnode2 = h('div', null, ...['Text2', h('span', null, 'Span')]);

        patch(vnode0, vnode1);
        expect(hostElm.childNodes[0].textContent).toEqual('Text');

        patch(vnode1, vnode2);
        expect(hostElm.childNodes[0].textContent).toEqual('Text2');
      });

      it('prepends element', () => {
        const vnode1 = h('div', null, ...[h('span', null, 'World')]);
        const vnode2 = h('div', null, ...[h('span', null, 'Hello'), h('span', null, 'World')]);

        patch(vnode0, vnode1);
        expect(map(inner, hostElm.children)).toEqual(['World']);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['Hello', 'World']);
      });

      it('prepends element of different tag type', () => {
        const vnode1 = h('div', null, ...[h('span', null, 'World')]);
        const vnode2 = h('div', null, ...[h('div', null, 'Hello'), h('span', null, 'World')]);

        patch(vnode0, vnode1);
        expect(map(inner, hostElm.children)).toEqual(['World']);

        patch(vnode1, vnode2);
        expect(map(prop('tagName'), hostElm.children)).toEqual(['DIV', 'SPAN']);
        expect(map(inner, hostElm.children)).toEqual(['Hello', 'World']);
      });

      it('removes elements', () => {
        const vnode1 = h('div', null, ...[h('span', null, 'One'), h('span', null, 'Two'), h('span', null, 'Three')]);
        const vnode2 = h('div', null, ...[h('span', null, 'One'), h('span', null, 'Three')]);

        patch(vnode0, vnode1);
        expect(map(inner, hostElm.children)).toEqual(['One', 'Two', 'Three']);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['One', 'Three']);
      });

      it('removes a single text node', () => {
        const vnode1 = h('div', null, 'One');
        const vnode2 = h('div', null);

        patch(vnode0, vnode1);
        expect(hostElm.textContent).toEqual('One');

        patch(vnode1, vnode2);
        expect(hostElm.textContent).toEqual('');
      });

      it('removes a single text node when children are updated', () => {
        const vnode1 = h('div', null, 'One');
        const vnode2 = h('div', null, ...[h('div', null, 'Two'), h('span', null, 'Three')]);

        patch(vnode0, vnode1);
        expect(hostElm.textContent).toEqual('One');

        patch(vnode1, vnode2);
        expect(map(prop('textContent'), hostElm.childNodes)).toEqual(['Two', 'Three']);
      });

      it('should replace elements created with Array().map with text', () => {
        const a = Array.from(Array(2)).map(() => h('div', null, 'a'));

        const vnode1 = h('span', null, ...a);
        const vnode2 = h('span', null, 'just text');

        patch(vnode0, vnode1);

        expect(hostElm.childNodes.length).toEqual(2);
        expect(hostElm.textContent).toEqual('aa');

        patch(vnode1, vnode2);
        expect(hostElm.childNodes.length).toEqual(1);
        expect(hostElm.textContent).toEqual('just text');
      });

      it('removes a text node among other elements', () => {
        const vnode1 = h('div', null, ...['One', h('span', null, 'Two')]);
        const vnode2 = h('div', null, ...[h('div', null, 'Three')]);

        patch(vnode0, vnode1);
        expect(map(prop('textContent'), hostElm.childNodes)).toEqual(['One', 'Two']);

        patch(vnode1, vnode2);

        expect(hostElm.childNodes.length).toEqual(1);
        expect(hostElm.childNodes[0].tagName).toEqual('DIV');
        expect(hostElm.childNodes[0].textContent).toEqual('Three');
      });

      it('reorders elements', () => {
        const vnode1 = h('div', null, ...[h('span', null, 'One'), h('div', null, 'Two'), h('b', null, 'Three')]);
        const vnode2 = h('div', null, ...[h('b', null, 'Three'), h('span', null, 'One'), h('div', null, 'Two')]);

        patch(vnode0, vnode1);
        expect(map(inner, hostElm.children)).toEqual(['One', 'Two', 'Three']);

        patch(vnode1, vnode2);
        expect(map(prop('tagName'), hostElm.children)).toEqual(['B', 'SPAN', 'DIV']);
        expect(map(inner, hostElm.children)).toEqual(['Three', 'One', 'Two']);
      });

      it('supports null/undefined children', () => {
        const vnode1 = h('i', null, ...[null, h('i', null, '1'), h('i', null, '2'), null]);
        const vnode2 = h('i', null, ...[h('i', null, '2'), undefined, undefined, h('i', null, '1'), undefined]);
        const vnode3 = h('i', null, ...[null, h('i', null, '1'), undefined, null, h('i', null, '2'), undefined, null]);

        patch(vnode0, vnode1);
        expect(map(inner, hostElm.children)).toEqual(['1', '2']);

        patch(vnode1, vnode2);
        expect(map(inner, hostElm.children)).toEqual(['2', '1']);

        patch(vnode2, vnode3);
        expect(map(inner, hostElm.children)).toEqual(['1', '2']);
      });

      it('supports all null/undefined children', () => {
        const vnode1 = h('i', null, ...[h('i', null, '1'), h('i', null, '2')]);
        const vnode2 = h('i', null, ...[null, null, undefined]);
        const vnode3 = h('i', null, ...[h('i', null, '2'), h('i', null, '1')]);

        patch(vnode0, vnode1);

        patch(vnode1, vnode2);
        expect(hostElm.children.length).toEqual(0);

        patch(vnode2, vnode3);
        expect(map(inner, hostElm.children)).toEqual(['2', '1']);
      });
    });
  });

  function prop(name: any) {
    return function (obj: any) {
      return obj[name];
    };
  }

  function map(fn: any, list: any) {
    const ret = [];
    for (let i = 0; i < list.length; ++i) {
      ret[i] = fn(list[i]);
    }
    return ret;
  }
});
