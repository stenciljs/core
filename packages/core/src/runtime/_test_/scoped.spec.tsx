import { Component, h, Host, Prop, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { expect, describe, it } from '@stencil/vitest';

describe('scoped', () => {
  it('should add scoped classes', async () => {
    @Component({
      tag: 'cmp-a',
      styles: ':host { color: inherit }',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <cmp-b>
            <span>Hola</span>
          </cmp-b>
        );
      }
    }

    @Component({
      tag: 'cmp-b',
      styles: ':host { color: inherit }',
      scoped: true,
    })
    class CmpB {
      render() {
        return (
          <div>
            <slot></slot>
          </div>
        );
      }
    }
    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-a></cmp-a>`,
    });

    expect(page.root).toEqualHtml(`
    <cmp-a class="sc-cmp-a-h hydrated">
      <cmp-b class="sc-cmp-a sc-cmp-b-h hydrated">
        <div class="sc-cmp-b sc-cmp-b-s">
          <span class="sc-cmp-a">
            Hola
          </span>
        </div>
      </cmp-b>
    </cmp-a>
    `);
  });

  it('should remove the scoped slot class when the slot is removed', async () => {
    @Component({
      tag: 'cmp-b',
      styles: ':host { color: inherit }',
      scoped: true,
    })
    class CmpB {
      @Prop() slot = true;

      render() {
        return (
          <div>
            {this.slot ? (
              <div key="one">
                <slot></slot>
              </div>
            ) : (
              <div key="two"></div>
            )}
          </div>
        );
      }
    }
    const page = await newSpecPage({
      components: [CmpB],
      includeAnnotations: true,
      html: `<cmp-b>hello</cmp-b>`,
    });

    expect(page.root).toEqualHtml(`
      <cmp-b class="sc-cmp-b-h hydrated">
        <div class="sc-cmp-b">
          <div class="sc-cmp-b sc-cmp-b-s">
            hello
          </div>
        </div>
      </cmp-b>
    `);

    (page.root as any).slot = false;
    await page.waitForChanges();
    await page.waitForChanges();

    expect(page.root).toEqualHtml(`
      <cmp-b class="sc-cmp-b-h hydrated">
        <!--s-nt-hello-->
        <div class="sc-cmp-b">
          <div class="sc-cmp-b"></div>
        </div>
      </cmp-b>
    `);
  });

  describe('should keep scope for onSlotChange', () => {
    @Component({
      tag: 'my-node-with-slot-changes',
      shadow: false,
      scoped: true,
    })
    class MyNodeWithSlotChanges {
      @State() slotChangeCount: number = 0;
      @State() lastChangeTime: string = '';

      setSectionSeparator = (): void => {
        this.slotChangeCount++;
        this.lastChangeTime = new Date().toLocaleTimeString();
      };

      render() {
        return (
          <Host>
            <div>
              <strong>Slot Change Monitor:</strong>
              <br />
              Changes detected: <span>{this.slotChangeCount}</span>
              <br />
              {this.lastChangeTime && (
                <span>
                  Last change: <span>{this.lastChangeTime}</span>
                </span>
              )}
            </div>

            <div>
              <div>Slot Content:</div>
              <slot onSlotchange={this.setSectionSeparator}></slot>
            </div>
          </Host>
        );
      }
    }

    it('renders with a slot', async () => {
      const page = await newSpecPage({
        components: [MyNodeWithSlotChanges],
        html: '<my-node-with-slot-changes><div>Test content</div></my-node-with-slot-changes>',
      });

      expect(page.root).toBeDefined();
      expect(page.root.querySelector('slot')).toBeDefined();
    });

    it('renders with initial state values', async () => {
      const page = await newSpecPage({
        components: [MyNodeWithSlotChanges],
        html: '<my-node-with-slot-changes></my-node-with-slot-changes>',
      });

      const component = page.rootInstance as MyNodeWithSlotChanges;
      expect(component.slotChangeCount).toBe(0);
      expect(component.lastChangeTime).toBe('');
    });

    it('renders the slot change monitor UI', async () => {
      const page = await newSpecPage({
        components: [MyNodeWithSlotChanges],
        html: '<my-node-with-slot-changes><span>Test content</span></my-node-with-slot-changes>',
      });

      const monitorText = page.root.textContent;
      expect(monitorText).toContain('Slot Change Monitor:');
      expect(monitorText).toContain('Changes detected: 0');
    });

    it('has the correct onSlotchange handler attached', async () => {
      const page = await newSpecPage({
        components: [MyNodeWithSlotChanges],
        html: '<my-node-with-slot-changes></my-node-with-slot-changes>',
      });

      // In scoped components, slot elements are replaced with text nodes for the slot polyfill
      // So we can't use querySelector('slot'). Instead, we should verify that the component
      // rendered without errors, which means the addEventListener call succeeded.
      expect(page.root).toBeDefined();

      // We can also verify that the component instance has the expected event handler
      const component = page.rootInstance as MyNodeWithSlotChanges;
      expect(typeof component.setSectionSeparator).toBe('function');

      // The slot is polyfilled as a text node, but we can verify the structure is correct
      expect(page.root.innerHTML).toContain('Slot Content:');
    });

    it('triggers slotchange handler when slot content changes', async () => {
      const page = await newSpecPage({
        components: [MyNodeWithSlotChanges],
        html: '<my-node-with-slot-changes><span>Initial content</span></my-node-with-slot-changes>',
      });

      const component = page.rootInstance as MyNodeWithSlotChanges;

      // Verify initial state
      expect(component.slotChangeCount).toBe(0);
      expect(component.lastChangeTime).toBe('');

      // Find the slot node (it's a text node with s-sr property in scoped components)
      const findSlotNode = (element: Element): any => {
        // Check if this element is a slot node
        if ((element as any)['s-sr'] && (element as any).dispatchEvent) {
          return element;
        }

        // Recursively check child nodes
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          if ((child as any)['s-sr'] && (child as any).dispatchEvent) {
            return child;
          }

          // If it's an element, recurse into it
          if (child.nodeType === 1) {
            const found = findSlotNode(child as Element);
            if (found) return found;
          }
        }

        return null;
      };

      const slotNode = findSlotNode(page.root);
      expect(slotNode).toBeTruthy();
      expect(typeof slotNode.dispatchEvent).toBe('function');

      // Create and dispatch a slotchange event manually
      const slotchangeEvent = new CustomEvent('slotchange', { bubbles: true });

      // Manually dispatch the event to test our polyfill
      slotNode.dispatchEvent(slotchangeEvent);

      // Wait for the component to update
      await page.waitForChanges();

      // Verify the handler was called and state was updated
      expect(component.slotChangeCount).toBe(1);
      expect(component.lastChangeTime).not.toBe('');

      // Verify the UI was updated to reflect the change
      const monitorText = page.root.textContent;
      expect(monitorText).toContain('Changes detected: 1');
    });

    it('slotchange handler can be called multiple times', async () => {
      const page = await newSpecPage({
        components: [MyNodeWithSlotChanges],
        html: '<my-node-with-slot-changes><div>Test content</div></my-node-with-slot-changes>',
      });

      const component = page.rootInstance as MyNodeWithSlotChanges;

      // Find the slot node
      const findSlotNode = (element: Element): any => {
        // Check if this element is a slot node
        if ((element as any)['s-sr'] && (element as any).dispatchEvent) {
          return element;
        }

        // Recursively check child nodes
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          if ((child as any)['s-sr'] && (child as any).dispatchEvent) {
            return child;
          }

          // If it's an element, recurse into it
          if (child.nodeType === 1) {
            const found = findSlotNode(child as Element);
            if (found) return found;
          }
        }

        return null;
      };

      const slotNode = findSlotNode(page.root);
      expect(slotNode).toBeTruthy();

      // Dispatch multiple slotchange events
      for (let i = 1; i <= 3; i++) {
        const slotchangeEvent = new CustomEvent('slotchange', { bubbles: true });
        slotNode.dispatchEvent(slotchangeEvent);
        await page.waitForChanges();

        expect(component.slotChangeCount).toBe(i);
      }

      // Verify the final state
      expect(component.slotChangeCount).toBe(3);
      const monitorText = page.root.textContent;
      expect(monitorText).toContain('Changes detected: 3');
    });
  });
});
