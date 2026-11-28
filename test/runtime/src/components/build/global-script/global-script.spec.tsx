import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

describe('global-script', () => {
  it('should have access to global script timestamp', async () => {
    const { root } = await render(<global-script-test />);

    // The global script should have set the timestamp before the component rendered
    const globalScriptTimeEl = root.querySelector('.global-script-time');
    expect(globalScriptTimeEl).toBeTruthy();

    const globalScriptTime = globalScriptTimeEl!.textContent;
    // Global script timestamp should be a valid number (not "not set")
    expect(globalScriptTime).not.toBe('not set');
    expect(Number(globalScriptTime)).toBeGreaterThan(0);
  });

  it('should render after global script runs', async () => {
    const { root } = await render(<global-script-test />);

    // Get the elapsed time between global script and render
    const elapsedEl = root.querySelector('.elapsed');
    const elapsed = Number(elapsedEl!.textContent);

    // The component should render after the global script (elapsed >= 0)
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
