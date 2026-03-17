import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for mixed decorator type conflicts between base class and component.
 * Verifies that when the same property name has different decorator types
 * in the base class vs component, the component's decorator takes precedence.
 */
describe('extends-mixed-decorators', () => {
  describe('mixed decorator type conflicts', () => {
    it('renders initial values', async () => {
      const { root } = await render(<extends-mixed-decorators />);

      expect(root.querySelector('h2')).toHaveTextContent('Mixed Decorator Types Test');
    });

    it('component @State overrides base @Prop (mixedName)', async () => {
      const { root } = await render(<extends-mixed-decorators />);

      // mixedName: Base has @Prop, Component has @State
      // Component @State should take precedence with its default value
      expect(root.querySelector('.mixed-name-value')).toHaveTextContent('Mixed Name: component state value');
    });

    it('component @Prop overrides base @State (mixedStateName)', async () => {
      const { root } = await render(<extends-mixed-decorators />);

      // mixedStateName: Base has @State, Component has @Prop
      // Component @Prop should take precedence with its default value
      expect(root.querySelector('.mixed-state-name-value')).toHaveTextContent('Mixed State Name: component prop value');
    });

    it('base-only properties work correctly', async () => {
      const { root } = await render(<extends-mixed-decorators />);

      expect(root.querySelector('.base-only-prop-value')).toHaveTextContent('Base Only Prop: base only prop value');
      expect(root.querySelector('.base-only-state-value')).toHaveTextContent('Base Only State: base only state value');
    });

    it('component-only state works correctly', async () => {
      const { root } = await render(<extends-mixed-decorators />);

      expect(root.querySelector('.component-only-state-value')).toHaveTextContent('Component Only State: component only state');
    });

    it('updates mixedName via method (as @State)', async () => {
      const { root, waitForChanges } = await render(<extends-mixed-decorators />);

      await (root as any).updateMixedName('updated via method');
      await waitForChanges();

      expect(root.querySelector('.mixed-name-value')).toHaveTextContent('Mixed Name: updated via method');
    });

    it('updates mixedStateName via attribute (as @Prop)', async () => {
      const { root, waitForChanges } = await render(<extends-mixed-decorators />);

      root.setAttribute('mixed-state-name', 'updated via attribute');
      await waitForChanges();

      expect(root.querySelector('.mixed-state-name-value')).toHaveTextContent('Mixed State Name: updated via attribute');
    });

    it('updates component-only state via method', async () => {
      const { root, waitForChanges } = await render(<extends-mixed-decorators />);

      await (root as any).updateComponentOnlyState('new state value');
      await waitForChanges();

      expect(root.querySelector('.component-only-state-value')).toHaveTextContent('Component Only State: new state value');
    });

    it('updates mixedName via button click', async () => {
      const { root, waitForChanges } = await render(<extends-mixed-decorators />);

      const button = root.querySelector('.update-mixed-name') as HTMLButtonElement;
      button.click();
      await waitForChanges();

      expect(root.querySelector('.mixed-name-value')).toHaveTextContent('Mixed Name: mixed name updated');
    });
  });
});
