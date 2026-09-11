import { Component, h } from '@stencil/core';

declare const global: any;

/**
 * Used by hydrate-timeout.e2e.ts to verify the AbortController shim: a
 * component that creates its own AbortController has that controller cascade-aborted
 * automatically when the render times out
 *
 * The outcome is reported via `global` (not observable through
 * renderToString's result) so the test can assert on it.
 */
@Component({
  tag: 'own-controller-cmp',
  shadow: true,
})
export class OwnControllerCmp {
  async componentWillLoad() {
    const controller = new AbortController();
    try {
      await new Promise<void>((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => {
          const err: any = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
        // deliberately never resolves on its own
      });
      global.__ownControllerOutcome = { ok: true };
    } catch (e: any) {
      global.__ownControllerOutcome = { ok: false, name: e && e.name };
    }
  }

  render() {
    return <div>own-controller-cmp</div>;
  }
}
