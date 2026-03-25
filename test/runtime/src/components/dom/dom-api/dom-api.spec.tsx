import { describe, it, expect, h } from '@stencil/vitest';
import { render } from '@stencil/vitest';

describe('dom-api', () => {
  it('should add css classes', async () => {
    const { root, waitForChanges } = await render(<dom-api class="class-a" />);

    expect(root.classList.contains('class-a')).toBe(true);
    expect(root.classList.contains('class-b')).toBe(false);

    root.classList.add('class-b', 'class-c');
    await waitForChanges();

    expect(root.classList.contains('class-a')).toBe(true);
    expect(root.classList.contains('class-b')).toBe(true);
    expect(root.classList.contains('class-c')).toBe(true);
    expect(root.classList.contains('class-d')).toBe(false);
    expect(root.className).toContain('class-a');
    expect(root.className).toContain('class-b');
    expect(root.className).toContain('class-c');
  });

  it('should remove css classes', async () => {
    const { root, waitForChanges } = await render(<dom-api class="class-a" />);

    root.classList.add('class-b', 'class-c');
    root.classList.remove('class-c');
    await waitForChanges();

    expect(root.classList.contains('class-a')).toBe(true);
    expect(root.classList.contains('class-b')).toBe(true);
    expect(root.classList.contains('class-c')).toBe(false);
  });

  it('should toggle css classes', async () => {
    const { root, waitForChanges } = await render(<dom-api class="class-a" />);

    root.classList.toggle('class-a');
    root.classList.toggle('class-b');
    await waitForChanges();

    expect(root.classList.contains('class-b')).toBe(true);
    expect(root.classList.contains('class-a')).toBe(false);
  });

  it('should set id', async () => {
    const { root, waitForChanges } = await render(<dom-api id="my-cmp" />);

    expect(root.id).toBe('my-cmp');

    root.id = 'my-changed-id';
    await waitForChanges();

    expect(root.id).toBe('my-changed-id');
  });

  it('should get/set attributes', async () => {
    const { root, waitForChanges } = await render(<dom-api id="my-cmp" mph="88" />);

    expect(root.hasAttribute('id')).toBe(true);
    expect(root.hasAttribute('mph')).toBe(true);
    expect(root.hasAttribute('whatever')).toBe(false);
    expect(root.getAttribute('id')).toBe('my-cmp');
    expect(root.getAttribute('mph')).toBe('88');
    expect(root.hasAttribute('enabled')).toBe(false);

    root.setAttribute('id', 'my-changed-id');
    root.setAttribute('town', 'hill valley');
    root.toggleAttribute('enabled');
    await waitForChanges();

    expect(root.getAttribute('id')).toBe('my-changed-id');
    expect(root.hasAttribute('town')).toBe(true);
    expect(root.hasAttribute('enabled')).toBe(true);

    root.removeAttribute('town');
    root.toggleAttribute('enabled');
    await waitForChanges();

    expect(root.hasAttribute('town')).toBe(false);
    expect(root.hasAttribute('enabled')).toBe(false);
  });

  it('should test html', async () => {
    const { root, waitForChanges } = await render(<dom-api />);

    const span = root.querySelector('span');
    expect(span).toBeTruthy();
    expect(span!.classList.contains('red')).toBe(true);
    expect(span!.classList.contains('green')).toBe(true);
    expect(span!.classList.contains('blue')).toBe(true);
    expect(span!.textContent).toBe('dom api');

    root.innerHTML = '<div>changed content</div>';
    await waitForChanges();

    expect(root.querySelector('div')!.textContent).toBe('changed content');
  });

  it('should test textContent', async () => {
    const { root, waitForChanges } = await render(<dom-api />);

    expect(root.textContent).toContain('dom api');

    root.textContent = 'updated text content';
    await waitForChanges();

    expect(root.textContent).toBe('updated text content');
    expect(root.nodeType).toBe(1);
    expect(root.nodeName).toBe('DOM-API');
    expect(root.tagName).toBe('DOM-API');
  });
});
