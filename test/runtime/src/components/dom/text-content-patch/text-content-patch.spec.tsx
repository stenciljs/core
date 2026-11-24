import { render, h, describe, it, expect, afterEach } from '@stencil/vitest';

describe('textContent patch', () => {
  describe('scoped encapsulation', () => {
    it('should return the content of all slots', async () => {
      const { root } = await render(
        <text-content-patch-scoped-with-slot>
          Slot content
          <p slot='suffix'>Suffix content</p>
        </text-content-patch-scoped-with-slot>,
      );

      expect(root.textContent).toContain('Slot content');
      expect(root.textContent).toContain('Suffix content');
    });

    it('should have default behavior when there is no default slot', async () => {
      const { root } = await render(<text-content-patch-scoped />);

      expect(root.textContent).toContain('Top content');
      expect(root.textContent).toContain('Bottom content');
    });

    it('should overwrite the default slot content', async () => {
      const { root, waitForChanges } = await render(
        <text-content-patch-scoped-with-slot>
          Slot content
          <p slot='suffix'>Suffix content</p>
        </text-content-patch-scoped-with-slot>,
      );

      root.textContent = 'New slot content';
      await waitForChanges();

      expect(root.textContent).toBe('New slot content');
    });

    it('should insert text node if there is no default slot', async () => {
      const { root, waitForChanges } = await render(<text-content-patch-scoped />);

      root.textContent = 'New slot content';
      await waitForChanges();

      expect(root.textContent).toBe('New slot content');
    });
  });

  describe('text setters', () => {
    const markup = '<img src="x" onerror="window.__textContentXss = true"><b>bold</b>';

    afterEach(() => {
      delete (window as any).__textContentXss;
    });

    it('should insert `textContent` markup as a text node in the default slot', async () => {
      const { root } = await render(
        <text-content-patch-scoped-with-slot>
          Slot content
          <p slot='suffix'>Suffix content</p>
        </text-content-patch-scoped-with-slot>,
      );
      root.textContent = markup;
      // give a parsed <img> time to fire its error handler
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(root.querySelector('img')).toBeNull();
      expect(root.querySelector('b')).toBeNull();
      expect((window as any).__textContentXss).toBeUndefined();
      expect(root.textContent).toBe(markup);
      expect(root.childNodes.length).toBe(1);
      expect(root.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      // the text is relocated into the default slot, between the two rendered paragraphs
      const realChildNodes = Array.from((root as any).__childNodes as NodeListOf<ChildNode>);
      const textIndex = realChildNodes.findIndex(
        (n) => n.nodeType === Node.TEXT_NODE && n.nodeValue === markup,
      );
      const topIndex = realChildNodes.findIndex((n) => n.textContent === 'Top content');
      const bottomIndex = realChildNodes.findIndex((n) => n.textContent === 'Bottom content');
      expect(topIndex).toBeLessThan(textIndex);
      expect(textIndex).toBeLessThan(bottomIndex);
    });

    it('should clear slotted content when `textContent` is set to an empty string or null', async () => {
      const { root } = await render(
        <text-content-patch-scoped-with-slot>
          Slot content
          <p slot='suffix'>Suffix content</p>
        </text-content-patch-scoped-with-slot>,
      );

      root.textContent = '';
      expect(root.childNodes.length).toBe(0);
      expect(root.textContent).toBe('');

      root.textContent = 'something';
      root.textContent = null;
      expect(root.childNodes.length).toBe(0);
    });

    // with no default slot the nodes stay in the host's light DOM, so these check the real child nodes
    const realTextNodes = (host: Element) =>
      Array.from((host as any).__childNodes as NodeListOf<ChildNode>)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.nodeValue);

    it('should insert markup as text on a host with only a named slot', async () => {
      const { root } = await render(<text-content-patch-scoped-named-slot />);

      root.textContent = markup;
      root.insertAdjacentText('afterbegin', `${markup} (afterbegin)`);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(root.querySelector('img')).toBeNull();
      expect(root.querySelector('b')).toBeNull();
      expect((window as any).__textContentXss).toBeUndefined();
      expect(realTextNodes(root)).toContain(markup);
      expect(realTextNodes(root)).toContain(`${markup} (afterbegin)`);
    });

    it('should prepend to a host with only a named slot', async () => {
      const { root } = await render(<text-content-patch-scoped-named-slot />);

      // no default slot, so `prepend` takes the native fallback path
      root.prepend('prepended');

      expect(realTextNodes(root)).toContain('prepended');
    });
  });
});
