import './variables.css';

import { Fragment, render, h, describe, it, expect, beforeEach } from '@stencil/vitest';

const css = `:root {
  --global-background: black;
  --global-color: white;
  --body-background: grey;
}
body {
  background: var(--body-background);
  color: var(--global-color);
}`;

describe('css-variables', () => {
  beforeEach(() => {
    // Add global styles
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  });

  describe('css-variables-no-encapsulation', () => {
    it('uses class-local css variables to set the background and color', async () => {
      const { root } = await render(<css-variables-no-encapsulation />);
      const blackLocalElm = root.querySelector('.black-local')!;

      expect(blackLocalElm).toHaveTextContent('No encapsulation: Black background');

      const styles = window.getComputedStyle(blackLocalElm);
      expect(styles.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(styles.color).toBe('rgb(255, 255, 255)');
    });

    it('uses global css variables to set the background, color, and font weight', async () => {
      const { root } = await render(<css-variables-no-encapsulation />);
      const blackGlobalElm = root.querySelector('.black-global')!;

      expect(blackGlobalElm).toHaveTextContent('No encapsulation: Black background (global style)');

      const styles = window.getComputedStyle(blackGlobalElm);
      expect(styles.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(styles.color).toBe('rgb(255, 255, 255)');
      expect(styles.fontWeight).toBe('800');
    });

    it('uses imported css variables to set the background and color', async () => {
      const { root } = await render(<css-variables-no-encapsulation />);
      const yellowGlobalElm = root.querySelector('.yellow-global')!;

      expect(yellowGlobalElm).toHaveTextContent('No encapsulation: Yellow background (global link)');

      const styles = window.getComputedStyle(yellowGlobalElm);
      expect(styles.backgroundColor).toBe('rgb(255, 255, 0)');
      expect(styles.color).toBe('rgb(0, 0, 0)');
    });
  });

  describe('css-variables-shadow-dom', () => {
    it("doesn't interfere with global variables", async () => {
      const { root, waitForChanges } = await render(<css-variables-shadow-dom />);
      const globalShadow = root.shadowRoot!.querySelector('.black-global-shadow')!;

      expect(globalShadow).toHaveTextContent('Shadow: Black background (global)');

      let styles = window.getComputedStyle(globalShadow);
      expect(styles.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(styles.color).toBe('rgb(255, 255, 255)');
      expect(styles.fontWeight).toBe('800');

      root.shadowRoot!.querySelector('button')!.click();
      await waitForChanges();

      expect(globalShadow).toHaveTextContent('Shadow: Black background (global)');

      styles = window.getComputedStyle(globalShadow);
      expect(styles.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(styles.color).toBe('rgb(255, 255, 255)');
      expect(styles.fontWeight).toBe('800');
    });

    it('repaints as a result of changing css variables', async () => {
      const { root, waitForChanges } = await render(<css-variables-shadow-dom />);
      const innerDiv = root.shadowRoot!.querySelector('.inner-div')!;

      let styles = window.getComputedStyle(innerDiv);
      expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(styles.color).toBe('rgb(0, 0, 255)');

      root.shadowRoot!.querySelector('button')!.click();
      await waitForChanges();

      styles = window.getComputedStyle(innerDiv);
      expect(styles.backgroundColor).toBe('rgb(0, 128, 0)');
      expect(styles.color).toBe('rgb(0, 0, 255)');
    });

    it('changes the text as a result of changing css variables', async () => {
      const { root, waitForChanges } = await render(<css-variables-shadow-dom />);
      const innerDiv = root.shadowRoot!.querySelector('.inner-div')!;

      expect(innerDiv).toHaveTextContent('Shadow: Red background');

      root.shadowRoot!.querySelector('button')!.click();
      await waitForChanges();

      expect(innerDiv).toHaveTextContent('Shadow: Green background');
    });

    it("doesn't change the font weight as a result of changing css variables", async () => {
      const { root, waitForChanges } = await render(<css-variables-shadow-dom />);
      const innerDiv = root.shadowRoot!.querySelector('.inner-div')!;

      let styles = window.getComputedStyle(innerDiv);
      expect(styles.fontWeight).toBe('400');

      root.shadowRoot!.querySelector('button')!.click();
      await waitForChanges();

      styles = window.getComputedStyle(innerDiv);
      expect(styles.fontWeight).toBe('400');
    });

    it("doesn't alter a second instance of the element", async () => {
      // Render two instances
      const { root: root1, waitForChanges } = await render(<css-variables-shadow-dom />);
      const { root: root2 } = await render(<css-variables-shadow-dom />);

      const innerDiv2 = root2.shadowRoot!.querySelector('.inner-div')!;

      let styles = window.getComputedStyle(innerDiv2);
      expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(styles.color).toBe('rgb(0, 0, 255)');

      // Click the button on the first instance
      root1.shadowRoot!.querySelector('button')!.click();
      await waitForChanges();

      // Verify second instance is unchanged
      styles = window.getComputedStyle(innerDiv2);
      expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(styles.color).toBe('rgb(0, 0, 255)');
    });
  });
});
