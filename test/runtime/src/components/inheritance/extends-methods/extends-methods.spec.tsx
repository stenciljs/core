import { describe, it, expect, render, h } from '@stencil/vitest';

describe('extends-methods', () => {
  describe('Method Inheritance Basics', () => {
    it('inherits @Method from base class', async () => {
      const { root } = await render(<extends-methods />);
      await (root as any).reset();

      const result = await (root as any).baseMethod();
      expect(result).toBe('base');

      const internalValue = await (root as any).getInternalValue();
      expect(internalValue).toBe('baseMethod called');

      const callLog = await (root as any).getCallLog();
      expect(callLog).toContain('baseMethod');
    });

    it('can call inherited methods that return values', async () => {
      const { root } = await render(<extends-methods />);
      await (root as any).reset();

      const result = await (root as any).baseMethod();
      expect(result).toBe('base');
      expect(typeof result).toBe('string');
    });

    it('overrides method with super() call', async () => {
      const { root } = await render(<extends-methods />);
      await (root as any).reset();

      const result = await (root as any).overridableMethod();
      expect(result).toBe('base-overridable+child');

      const callLog = await (root as any).getCallLog();
      expect(callLog).toContain('overridableMethod:base');
      expect(callLog).toContain('overridableMethod:child');

      const baseIndex = callLog.indexOf('overridableMethod:base');
      const childIndex = callLog.indexOf('overridableMethod:child');
      expect(baseIndex).toBeLessThan(childIndex);

      const internalValue = await (root as any).getInternalValue();
      expect(internalValue).toBe('child override with super');
    });

    it('executes child-specific methods', async () => {
      const { root } = await render(<extends-methods />);
      await (root as any).reset();

      const result = await (root as any).childMethod();
      expect(result).toBe('child');

      const internalValue = await (root as any).getInternalValue();
      expect(internalValue).toBe('childMethod called');

      const callLog = await (root as any).getCallLog();
      expect(callLog).toContain('childMethod');
    });

    it('composes parent and child methods', async () => {
      const { root } = await render(<extends-methods />);
      await (root as any).reset();

      const result = await (root as any).composedMethod();
      expect(result).toBe('baseMethod called + child composition');

      const callLog = await (root as any).getCallLog();
      expect(callLog).toContain('baseMethod');
      expect(callLog).toContain('composedMethod:child');

      const baseIndex = callLog.indexOf('baseMethod');
      const childIndex = callLog.indexOf('composedMethod:child');
      expect(baseIndex).toBeLessThan(childIndex);
    });

    it('updates component state from method calls', async () => {
      const { root, waitForChanges } = await render(<extends-methods />);
      await (root as any).reset();
      await waitForChanges();

      expect(root.querySelector('.display-value')).toHaveTextContent('waiting...');

      await (root as any).childMethod();
      await waitForChanges();

      expect(root.querySelector('.display-value')).toHaveTextContent('Child: childMethod called');
    });

    it('uses protected helper methods from base class', async () => {
      const { root, waitForChanges } = await render(<extends-methods />);
      await (root as any).reset();
      await waitForChanges();

      await (root as any).childMethod();
      await waitForChanges();

      expect(root.querySelector('.display-value')).toHaveTextContent('Child:');
    });

    it('maintains separate method call history', async () => {
      const { root } = await render(<extends-methods />);
      await (root as any).reset();

      await (root as any).baseMethod();
      await (root as any).childMethod();
      await (root as any).overridableMethod();

      const callLog = await (root as any).getCallLog();
      expect(callLog.length).toBe(4);
      expect(callLog[0]).toBe('baseMethod');
      expect(callLog[1]).toBe('childMethod');
      expect(callLog[2]).toBe('overridableMethod:base');
      expect(callLog[3]).toBe('overridableMethod:child');
    });

    it('resets state correctly', async () => {
      const { root } = await render(<extends-methods />);

      await (root as any).baseMethod();
      await (root as any).childMethod();

      let callLog = await (root as any).getCallLog();
      expect(callLog.length).toBeGreaterThan(0);

      await (root as any).reset();

      callLog = await (root as any).getCallLog();
      expect(callLog.length).toBe(0);

      const internalValue = await (root as any).getInternalValue();
      expect(internalValue).toBe('initial');
    });
  });
});
