import { render, h, describe, it, expect } from '@stencil/vitest';

describe('resolve-var-events', () => {
  const cases = [
    { desc: 'a local constant', event: 'myEvent', method: 'emitMyEvent', count: '.my-event-count' },
    {
      desc: 'a local object property',
      event: 'otherEvent',
      method: 'emitOtherEvent',
      count: '.other-event-count',
    },
    {
      desc: 'an object property imported from another module',
      event: 'importedEvent',
      method: 'emitImportedEvent',
      count: '.imported-event-count',
    },
  ] as const;

  for (const { desc, event, method, count } of cases) {
    it(`emits and listens to an event named by ${desc}`, async () => {
      const { root, waitForChanges, spyOnEvent } = await render(<resolve-var-events />);
      const eventSpy = spyOnEvent(event);

      await root[method]();
      await waitForChanges();

      expect(eventSpy).toHaveReceivedEventTimes(1);
      expect(root.shadowRoot!.querySelector(count)).toHaveTextContent('1');
    });
  }
});
