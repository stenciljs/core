import { setTagTransformer, transformTag } from '@stencil/core';
import { render, describe, it, expect } from '@stencil/vitest';

import tagTransformer from '../../../tag-transformer.js';

describe('tag-transform', () => {
  it('transforms tag names correctly', () => {
    setTagTransformer(tagTransformer);

    expect(transformTag('child-tag-transform')).toBe('child-tag-is-transformed');
    expect(transformTag('parent-tag-transform')).toBe('parent-tag-is-transformed');
    expect(transformTag('something-else')).toBe('something-else');
  });

  it('renders components with transformed tag names', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    expect(root).toBeTruthy();
    expect(root.tagName.toLowerCase()).toBe('parent-tag-is-transformed');
  });

  it('transforms tags within jsx rendering', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    // The child components should be rendered with transformed tag names
    const childElements = root.querySelectorAll('child-tag-is-transformed');
    expect(childElements.length).toBe(2);
  });

  it('transforms tags within querySelector using original name', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    // querySelector with original tag name should find transformed elements
    const child = await (root as HTMLParentTagTransformElement).querySelectorChildTags();
    expect(child).toBeTruthy();
  });

  it('transforms tags within querySelectorAll using original name', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    // querySelectorAll with original tag name should find transformed elements
    const children = await (root as HTMLParentTagTransformElement).querySelectorAllChildTags();
    expect(children.length).toBe(2);
  });

  it('transforms tags within createElement', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    // createElement with original tag name should create transformed element
    const child = await (root as HTMLParentTagTransformElement).createChildTagElement();
    expect(child.tagName).toBe('CHILD-TAG-IS-TRANSFORMED');
  });

  it('transforms tags within closest using original name', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    // closest with original tag name should find transformed parent
    const childElement = root.querySelector<HTMLChildTagTransformElement>(
      'child-tag-is-transformed',
    );
    const parent = await childElement!.closestParentTag();
    expect(parent).toBeTruthy();
  });

  it('applies styles using transformed css selectors', async () => {
    const { root } = await render(<parent-tag-is-transformed />);
    const childElement = root.querySelector('child-tag-is-transformed');
    // The CSS uses child-tag-transform selector but should apply to child-tag-is-transformed
    expect(window.getComputedStyle(childElement!).borderColor).toBe('rgb(0, 0, 255)');
  });
});
