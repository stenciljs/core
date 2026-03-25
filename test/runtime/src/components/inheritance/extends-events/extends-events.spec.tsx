import { describe, it, expect, render, h } from '@stencil/vitest';

describe('extends-events', () => {
  describe('Event Handling Inheritance (@Listen decorators)', () => {
    it('inherits base class window listener', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-base-window')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('base-window-event');
    });

    it('inherits base class document listener', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-base-document')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('base-document-event');
    });

    it('inherits base class host listener', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-base-host')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('base-host-event');
    });

    it('handles child class window listener', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-child-window')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('child-window-event');
    });

    it('handles child class document listener', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-child-document')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('child-document-event');
    });

    it('handles child class host listener', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-child-host')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('child-host-event');
    });

    it('child override event handler takes precedence over base', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-override')!.click();
      await waitForChanges();

      const eventLog = root.querySelector('#event-log-list');
      const logContent = eventLog?.textContent || '';

      // Child handler should be called (override behavior)
      expect(logContent).toContain('override-event:child');

      // Base handler should NOT be called (override takes precedence)
      expect(logContent).not.toContain('override-event:base');
    });

    it('handles event bubbling correctly', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-bubble')!.click();
      await waitForChanges();

      expect(root.querySelector('#event-log-list')).toHaveTextContent('bubble-event:child');
    });

    it('tracks events in combined event log', async () => {
      const { root, waitForChanges } = await render(<extends-events />);

      root.querySelector<HTMLButtonElement>('.trigger-base-window')!.click();
      await waitForChanges();
      root.querySelector<HTMLButtonElement>('.trigger-child-window')!.click();
      await waitForChanges();
      root.querySelector<HTMLButtonElement>('.trigger-base-host')!.click();
      await waitForChanges();

      const eventLog = root.querySelector('#event-log-list');
      const logContent = eventLog?.textContent || '';

      expect(logContent).toContain('base-window-event');
      expect(logContent).toContain('child-window-event');
      expect(logContent).toContain('base-host-event');
    });
  });
});
