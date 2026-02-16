import { h, newVNode } from '../h';
import { isSameVnode, patch } from '../vdom-render';

describe('template elements', () => {
  it('should append children to template.content, not template directly', () => {
    const hostElm = document.createElement('div');
    const vnode0 = newVNode(null, null);
    vnode0.$elm$ = hostElm;

    // Create a template with children
    const vnode1 = h('div', null, h('template', null, h('span', null, 'Hello'), h('p', null, 'World')));

    patch(vnode0, vnode1);

    const templateEl = hostElm.querySelector('template') as HTMLTemplateElement;
    expect(templateEl).toBeDefined();

    // Children should NOT be direct children of the template element
    expect(templateEl.childNodes.length).toBe(0);

    // Children should be in the template.content DocumentFragment
    expect(templateEl.content.childNodes.length).toBe(2);
    expect((templateEl.content.childNodes[0] as HTMLElement).tagName).toBe('SPAN');
    expect((templateEl.content.childNodes[0] as HTMLElement).textContent).toBe('Hello');
    expect((templateEl.content.childNodes[1] as HTMLElement).tagName).toBe('P');
    expect((templateEl.content.childNodes[1] as HTMLElement).textContent).toBe('World');
  });

  it('should allow cloning template content', () => {
    const hostElm = document.createElement('div');
    const vnode0 = newVNode(null, null);
    vnode0.$elm$ = hostElm;

    const vnode1 = h('div', null, h('template', null, h('div', { class: 'test' }, 'Content to clone')));

    patch(vnode0, vnode1);

    const templateEl = hostElm.querySelector('template') as HTMLTemplateElement;

    // Should be able to clone the content
    const cloned = templateEl.content.cloneNode(true) as DocumentFragment;
    expect(cloned.childNodes.length).toBe(1);
    expect((cloned.childNodes[0] as HTMLElement).className).toBe('test');
    expect((cloned.childNodes[0] as HTMLElement).textContent).toBe('Content to clone');
  });

  it('should update template children correctly', () => {
    const hostElm = document.createElement('div');
    const vnode0 = newVNode(null, null);
    vnode0.$elm$ = hostElm;

    const vnode1 = h('div', null, h('template', null, h('span', null, 'Initial')));
    patch(vnode0, vnode1);

    const templateEl = hostElm.querySelector('template') as HTMLTemplateElement;
    expect(templateEl.content.childNodes.length).toBe(1);
    expect((templateEl.content.childNodes[0] as HTMLElement).textContent).toBe('Initial');

    // Update the template content
    const vnode2 = h('div', null, h('template', null, h('span', null, 'Updated')));
    patch(vnode1, vnode2);

    expect(templateEl.content.childNodes.length).toBe(1);
    expect((templateEl.content.childNodes[0] as HTMLElement).textContent).toBe('Updated');
  });
});

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
