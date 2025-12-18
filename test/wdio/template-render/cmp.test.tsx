import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser } from '@wdio/globals';

describe('template-render', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => <template-render></template-render>,
    });
  });

  it('should render template elements', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    expect(host).toBeDefined();

    const shadowRoot = host.shadowRoot;
    expect(shadowRoot).toBeDefined();

    const simpleTemplate = shadowRoot.querySelector('template#simple-template');
    expect(simpleTemplate).toBeDefined();
    expect(simpleTemplate.tagName).toBe('TEMPLATE');
  });

  it('should have children in template.content, not as direct children', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    const shadowRoot = host.shadowRoot;

    const simpleTemplate = shadowRoot.querySelector<HTMLTemplateElement>('#simple-template');

    // Template element itself should have NO child nodes
    expect(simpleTemplate.childNodes.length).toBe(0);

    // Template content should have the children
    expect(simpleTemplate.content.childNodes.length).toBeGreaterThan(0);

    const contentChild = simpleTemplate.content.querySelector('.template-content');
    expect(contentChild).toBeDefined();
    expect(contentChild.textContent).toBe('This is template content');
  });

  it('should support nested template content', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    const shadowRoot = host.shadowRoot;

    const nestedTemplate = shadowRoot.querySelector<HTMLTemplateElement>('template#nested-template');

    // Template should have no direct children
    expect(nestedTemplate.childNodes.length).toBe(0);

    // Content should have the nested structure
    const container = nestedTemplate.content.querySelector('.container');
    expect(container).toBeDefined();
    expect(container.childNodes.length).toBe(3); // h2, p, span

    const h2 = container.querySelector('h2');
    expect(h2.textContent).toBe('Nested Template');

    const p = container.querySelector('p');
    expect(p.textContent).toBe('With multiple children');

    const span = container.querySelector('span');
    expect(span.textContent).toBe('And different tags');
  });

  it('should allow cloning template content', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    const shadowRoot = host.shadowRoot;

    const listTemplate = shadowRoot.querySelector<HTMLTemplateElement>('template#list-template');
    expect(listTemplate).toBeDefined();

    // Clone the template content
    const clone = listTemplate.content.cloneNode(true) as DocumentFragment;
    expect(clone.childNodes.length).toBe(1);

    const clonedLi = clone.querySelector('li');
    expect(clonedLi).toBeDefined();
    expect(clonedLi.classList.contains('list-item')).toBe(true);

    const clonedSpan = clonedLi.querySelector('.item-text');
    expect(clonedSpan).toBeDefined();
    expect(clonedSpan.textContent).toBe('Placeholder');
  });

  it('should allow multiple clones from the same template', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    const shadowRoot = host.shadowRoot;

    const listTemplate = shadowRoot.querySelector<HTMLTemplateElement>('template#list-template');
    const container = shadowRoot.querySelector('#cloned-container');

    // Clone and append multiple times
    for (let i = 1; i <= 3; i++) {
      const clone = listTemplate.content.cloneNode(true) as DocumentFragment;
      const li = clone.querySelector('li');
      const span = li.querySelector('.item-text');
      span.textContent = `Cloned Item ${i}`;
      container.appendChild(clone);
    }

    // Verify all clones were added
    const clonedItems = container.querySelectorAll('.list-item');
    expect(clonedItems.length).toBe(3);

    expect(clonedItems[0].querySelector('.item-text').textContent).toBe('Cloned Item 1');
    expect(clonedItems[1].querySelector('.item-text').textContent).toBe('Cloned Item 2');
    expect(clonedItems[2].querySelector('.item-text').textContent).toBe('Cloned Item 3');
  });

  it('should handle template content after component updates', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    const shadowRoot = host.shadowRoot;

    const addButton = shadowRoot.querySelector('#add-item') as HTMLButtonElement;
    const listTemplate = shadowRoot.querySelector('#list-template') as HTMLTemplateElement;

    // Trigger a component update
    addButton.click();
    await browser.pause(100); // Wait for update

    // Template content should still be intact and cloneable
    expect(listTemplate.content.childNodes.length).toBeGreaterThan(0);

    const clone = listTemplate.content.cloneNode(true) as DocumentFragment;
    const clonedLi = clone.querySelector('li');
    expect(clonedLi).toBeDefined();
    expect(clonedLi.classList.contains('list-item')).toBe(true);
  });

  it('should not have template content as visible children in the DOM', async () => {
    await $('template-render').waitForExist();
    const host = document.querySelector('template-render');
    const shadowRoot = host.shadowRoot;

    const simpleTemplate = shadowRoot.querySelector<HTMLTemplateElement>('template#simple-template');

    // The template's content should not be visible in the rendered tree
    // Only when cloned and appended should it become visible
    const visibleTemplateContent = shadowRoot.querySelector('.template-content');
    expect(visibleTemplateContent).toBeNull();

    // But it should exist in the template.content
    const contentInTemplate = simpleTemplate.content.querySelector('.template-content');
    expect(contentInTemplate).toBeDefined();
  });
});
