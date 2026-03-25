import { describe, it, expect, render, h } from '@stencil/vitest';

describe('extends-props-state', () => {
  describe('Property & State Inheritance Basics', () => {
    it('renders default inherited @Prop values from base class', async () => {
      const { root } = await render(<extends-props-state />);

      expect(root.querySelector('.base-prop')).toHaveTextContent('Base Prop: base prop value');
      expect(root.querySelector('.base-count')).toHaveTextContent('Base Count: 0');
    });

    it('renders default inherited @State values from base class', async () => {
      const { root } = await render(<extends-props-state />);

      expect(root.querySelector('.base-state')).toHaveTextContent('Base State: base state value');
      expect(root.querySelector('.base-enabled')).toHaveTextContent('Base Enabled: true');
    });

    it('renders component-specific @Prop values without conflicts', async () => {
      const { root } = await render(<extends-props-state />);

      expect(root.querySelector('.component-prop')).toHaveTextContent('Component Prop: component prop value');
    });

    it('renders component-specific @State values without conflicts', async () => {
      const { root } = await render(<extends-props-state />);

      expect(root.querySelector('.component-state-value')).toHaveTextContent('Component State: component state value');
    });

    it('updates inherited @Prop via attribute', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      root.setAttribute('base-prop', 'updated via attribute');
      await waitForChanges();

      expect(root.querySelector('.base-prop')).toHaveTextContent('Base Prop: updated via attribute');
    });

    it('updates inherited @Prop via property', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      (root as any).baseProp = 'updated via property';
      await waitForChanges();

      expect(root.querySelector('.base-prop')).toHaveTextContent('Base Prop: updated via property');
    });

    it('updates inherited number @Prop and triggers re-render', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      root.setAttribute('base-count', '5');
      await waitForChanges();

      expect(root.querySelector('.base-count')).toHaveTextContent('Base Count: 5');
    });

    it('updates component @Prop via attribute', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      root.setAttribute('component-prop', 'updated component prop');
      await waitForChanges();

      expect(root.querySelector('.component-prop')).toHaveTextContent('Component Prop: updated component prop');
    });

    it('updates inherited @State and triggers re-render', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      root.querySelector<HTMLButtonElement>('.update-base-state')!.click();
      await waitForChanges();

      expect(root.querySelector('.base-state')).toHaveTextContent('Base State: base state updated');
    });

    it('updates component @State and triggers re-render', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      root.querySelector<HTMLButtonElement>('.update-component-state')!.click();
      await waitForChanges();

      expect(root.querySelector('.component-state-value')).toHaveTextContent('Component State: component state updated');
    });

    it('toggles inherited boolean @State and re-renders', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      // Initial state should be true
      expect(root.querySelector('.base-enabled')).toHaveTextContent('Base Enabled: true');

      // Toggle to false
      root.querySelector<HTMLButtonElement>('.toggle-base-enabled')!.click();
      await waitForChanges();
      expect(root.querySelector('.base-enabled')).toHaveTextContent('Base Enabled: false');

      // Toggle back to true
      root.querySelector<HTMLButtonElement>('.toggle-base-enabled')!.click();
      await waitForChanges();
      expect(root.querySelector('.base-enabled')).toHaveTextContent('Base Enabled: true');
    });

    it('increments inherited number @Prop via method and re-renders', async () => {
      const { root, waitForChanges } = await render(<extends-props-state />);

      // Initial value should be 0
      expect(root.querySelector('.base-count')).toHaveTextContent('Base Count: 0');

      // Increment to 1
      root.querySelector<HTMLButtonElement>('.increment-base-count')!.click();
      await waitForChanges();
      expect(root.querySelector('.base-count')).toHaveTextContent('Base Count: 1');

      // Increment to 2
      root.querySelector<HTMLButtonElement>('.increment-base-count')!.click();
      await waitForChanges();
      expect(root.querySelector('.base-count')).toHaveTextContent('Base Count: 2');
    });
  });
});
