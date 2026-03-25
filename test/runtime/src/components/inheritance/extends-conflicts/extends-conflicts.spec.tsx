import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for conflict resolution when component and base class
 * have the same @Prop, @State, or @Method names.
 * Component versions should override base versions.
 */
describe('extends-conflicts', () => {
  describe('decorator conflict resolution', () => {
    it('renders initial values', async () => {
      const { root } = await render(<extends-conflicts />);

      expect(root.querySelector('h2')).toHaveTextContent('Decorator Conflicts Test');
    });

    it('component @Prop overrides base @Prop (duplicateProp)', async () => {
      const { root } = await render(<extends-conflicts />);

      // Component's duplicateProp value should win
      expect(root.querySelector('.duplicate-prop-value')).toHaveTextContent('Duplicate Prop: component prop value');
    });

    it('component @State overrides base @State (duplicateState)', async () => {
      const { root } = await render(<extends-conflicts />);

      // Component's duplicateState value should win
      expect(root.querySelector('.duplicate-state-value')).toHaveTextContent('Duplicate State: component state value');
    });

    it('base-only properties work correctly', async () => {
      const { root } = await render(<extends-conflicts />);

      expect(root.querySelector('.base-only-prop-value')).toHaveTextContent('Base Only Prop: base only prop value');
      expect(root.querySelector('.base-only-state-value')).toHaveTextContent('Base Only State: base only state value');
    });

    it('component-only state works correctly', async () => {
      const { root } = await render(<extends-conflicts />);

      expect(root.querySelector('.component-only-state-value')).toHaveTextContent('Component Only State: component only state');
    });

    it('component @Method overrides base @Method (duplicateMethod)', async () => {
      const { root } = await render(<extends-conflicts />);

      // Call the duplicate method
      const result = await (root as any).duplicateMethod();

      // Component version should be called
      expect(result).toBe('component method');

      // Verify component method log, not base method log
      const componentLog = await (root as any).getComponentMethodCallLog();
      expect(componentLog).toContain('duplicateMethod:component');
    });

    it('base-only method still works', async () => {
      const { root } = await render(<extends-conflicts />);

      const result = await (root as any).baseOnlyMethod();
      expect(result).toBe('base only method');
    });

    it('updates duplicate state via method', async () => {
      const { root, waitForChanges } = await render(<extends-conflicts />);

      await (root as any).updateDuplicateState('new duplicate state');
      await waitForChanges();

      expect(root.querySelector('.duplicate-state-value')).toHaveTextContent('Duplicate State: new duplicate state');
    });

    it('updates duplicate prop via attribute', async () => {
      const { root, waitForChanges } = await render(<extends-conflicts />);

      root.setAttribute('duplicate-prop', 'new duplicate prop');
      await waitForChanges();

      expect(root.querySelector('.duplicate-prop-value')).toHaveTextContent('Duplicate Prop: new duplicate prop');
    });
  });
});
