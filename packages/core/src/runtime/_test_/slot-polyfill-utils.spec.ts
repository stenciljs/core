import { expect, describe, it } from '@stencil/vitest';
import type * as d from '@stencil/core';

import { findSlotFromSlottedNode, getHostSlotNodes } from '../slot-polyfill-utils';

/** A slot reference node, as the vdom creates it for a non-shadow `<slot>`. */
const slotRef = (hostTag: string, name: string) => {
  const node = document.createTextNode('') as unknown as d.RenderNode;
  node['s-sr'] = true;
  node['s-hn'] = hostTag;
  node['s-sn'] = name;
  return node;
};

const slotted = (name?: string): d.PatchedSlotNode => {
  const el = document.createElement('span');
  if (name) el.setAttribute('slot', name);
  return el;
};

const childNodesOf = (el: Element) => el.childNodes as NodeListOf<ChildNode>;

describe('getHostSlotNodes', () => {
  it('returns every slot of the host, in document order', () => {
    const host = document.createElement('cmp-a');
    const wrap = document.createElement('div');
    const a = slotRef('CMP-A', '');
    const b = slotRef('CMP-A', 'end');
    wrap.append(a, slotRef('CMP-B', ''));
    host.append(wrap, b);

    expect(getHostSlotNodes(childNodesOf(host), 'CMP-A')).toEqual([a, b]);
  });

  it('returns only the first slot with the given name', () => {
    const host = document.createElement('cmp-a');
    const wrap = document.createElement('div');
    const first = slotRef('CMP-A', 'end');
    wrap.append(first);
    host.append(wrap, slotRef('CMP-A', 'end'));

    expect(getHostSlotNodes(childNodesOf(host), 'CMP-A', 'end')).toEqual([first]);
    expect(getHostSlotNodes(childNodesOf(host), 'CMP-A', 'missing')).toEqual([]);
  });
});

describe('findSlotFromSlottedNode', () => {
  it('finds the slot a node belongs to', () => {
    const host = document.createElement('cmp-a');
    const def = slotRef('CMP-A', '');
    const end = slotRef('CMP-A', 'end');
    host.append(def, end);

    expect(findSlotFromSlottedNode(slotted(), host)).toEqual({ slotNode: def, slotName: '' });
    expect(findSlotFromSlottedNode(slotted('end'), host)).toEqual({
      slotNode: end,
      slotName: 'end',
    });
  });

  it('does not return a remembered slot that has left the host', () => {
    const host = document.createElement('cmp-a');
    const first = slotRef('CMP-A', '');
    host.append(first);
    expect(findSlotFromSlottedNode(slotted(), host).slotNode).toBe(first);

    first.remove();
    const second = slotRef('CMP-A', '');
    host.append(second);
    expect(findSlotFromSlottedNode(slotted(), host).slotNode).toBe(second);

    second.remove();
    expect(findSlotFromSlottedNode(slotted(), host).slotNode).toBeUndefined();
  });

  it('does not return a remembered slot that was renamed', () => {
    const host = document.createElement('cmp-a');
    const slot = slotRef('CMP-A', 'start');
    host.append(slot);
    expect(findSlotFromSlottedNode(slotted('start'), host).slotNode).toBe(slot);

    slot['s-sn'] = 'end';
    expect(findSlotFromSlottedNode(slotted('start'), host).slotNode).toBeUndefined();
    expect(findSlotFromSlottedNode(slotted('end'), host).slotNode).toBe(slot);
  });
});
