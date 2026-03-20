import { describe, it, expect, render, h } from '@stencil/vitest';

describe('extends-watch', () => {
  describe('Watch Decorator Inheritance', () => {
    it('inherits base class @Watch decorator for baseProp', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseProp('base prop updated');
      await waitForChanges();

      expect(root.querySelector('.base-watch-count')).toHaveTextContent('Base Watch Calls:');
      expect(root.querySelector('#watch-log-list')).toHaveTextContent('basePropChanged');
    });

    it('inherits base class @Watch decorator for baseCount', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseCount(5);
      await waitForChanges();

      expect(root.querySelector('#watch-log-list')).toHaveTextContent('baseCountChanged');
    });

    it('inherits base class @Watch decorator for baseState', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseState('base state updated');
      await waitForChanges();

      expect(root.querySelector('#watch-log-list')).toHaveTextContent('baseStateChanged');
    });

    it('handles child class @Watch decorator for childProp', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateChildProp('child prop updated');
      await waitForChanges();

      expect(root.querySelector('.child-watch-count')).toHaveTextContent('Child Watch Calls:');
      expect(root.querySelector('#watch-log-list')).toHaveTextContent('childPropChanged');
    });

    it('executes watch handlers in correct order: base first, then child', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseProp('base prop updated');
      await waitForChanges();

      const watchLog = root.querySelector('#watch-log-list');
      const logContent = watchLog?.textContent || '';

      const basePropIndex = logContent.indexOf('basePropChanged');
      const childBasePropIndex = logContent.indexOf('childBasePropChanged');

      expect(basePropIndex).toBeGreaterThan(-1);
      expect(childBasePropIndex).toBeGreaterThan(-1);
      expect(basePropIndex).toBeLessThan(childBasePropIndex);
    });

    it('child override watch handler takes precedence over base', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateOverrideProp('override prop updated');
      await waitForChanges();

      const watchLog = root.querySelector('#watch-log-list');
      const logContent = watchLog?.textContent || '';

      // Child handler should be called (override behavior)
      expect(logContent).toContain('overridePropChanged:child');

      // Base handler should NOT be called (override takes precedence)
      expect(logContent).not.toContain('overridePropChanged:base');
    });

    it('reactive property chains work: baseProp change triggers baseState change', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseProp('base prop updated');
      await waitForChanges();

      expect(root.querySelector('.base-state-value')).toHaveTextContent('state updated by baseProp');
    });

    it('reactive property chains work: baseCount change triggers baseChainCount change', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseCount(5);
      await waitForChanges();

      // baseCount (5) * 2 = 10
      expect(root.querySelector('.base-chain-count')).toHaveTextContent('Base Chain Count: 10');
    });

    it('reactive property chains work: baseCounter change triggers baseChainTriggered', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateBaseCounter(10);
      await waitForChanges();

      expect(root.querySelector('.base-chain-triggered')).toHaveTextContent('Base Chain Triggered: true');
    });

    it('reactive property chains work: childProp change triggers childState change', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateChildProp('child prop updated');
      await waitForChanges();

      expect(root.querySelector('.child-state-value')).toHaveTextContent('state updated by childProp');
    });

    it('reactive property chains work: childCounter change triggers childChainTriggered', async () => {
      const { root, waitForChanges } = await render(<extends-watch />);
      await (root as any).resetWatchLogs();
      await waitForChanges();

      await (root as any).updateChildCounter(20);
      await waitForChanges();

      expect(root.querySelector('.child-chain-triggered')).toHaveTextContent('Child Chain Triggered: true');
    });
  });
});
