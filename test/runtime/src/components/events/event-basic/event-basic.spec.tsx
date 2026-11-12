import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

describe('event-basic', () => {
  it('should dispatch an event on load', async () => {
    const { root } = await render(<event-basic />);
    expect(root.querySelector('#counter')).toHaveTextContent('1');
  });

  it('should increment counter on each event emission', async () => {
    const { root, waitForChanges, spyOnEvent } = await render(<event-basic />);
    const eventSpy = spyOnEvent('testEvent');

    // Initial emission happened in componentDidLoad
    expect(root.querySelector('#counter')).toHaveTextContent('1');

    // Manually emit another event
    root.dispatchEvent(new CustomEvent('testEvent'));
    await waitForChanges();

    expect(eventSpy).toHaveReceivedEventTimes(1);
    expect(root.querySelector('#counter')).toHaveTextContent('2');
  });
});
