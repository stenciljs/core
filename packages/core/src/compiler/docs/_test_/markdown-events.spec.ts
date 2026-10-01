import { describe, expect, it } from 'vitest';

import { eventsToMarkdown } from '../readme/markdown-events';

describe('markdown events', () => {
  it('renders the base Events table', () => {
    const markdown = eventsToMarkdown([
      {
        event: 'myEventOne',
        bubbles: true,
        cancelable: true,
        composed: true,
        complexType: { original: 'void', resolved: 'void', references: {} },
        docs: 'Emitted when one happens',
        docsTags: [],
        detail: 'void',
      },
      {
        event: 'myEventTwo',
        bubbles: false,
        cancelable: false,
        composed: false,
        complexType: { original: 'string', resolved: 'string', references: {} },
        docs: 'Emitted when two happens',
        docsTags: [],
        detail: 'string',
      },
    ]).join('\n');

    expect(markdown).toEqual(`## Events

| Event        | Description              | Type                  |
| ------------ | ------------------------ | --------------------- |
| \`myEventOne\` | Emitted when one happens | \`CustomEvent<void>\`   |
| \`myEventTwo\` | Emitted when two happens | \`CustomEvent<string>\` |

`);
  });

  it('renders no content when there are no events', () => {
    expect(eventsToMarkdown([])).toEqual([]);
  });

  it('renders custom columns driven by docsTags, in array order', () => {
    const markdown = eventsToMarkdown(
      [
        {
          event: 'configEvent',
          bubbles: true,
          cancelable: true,
          composed: true,
          complexType: { original: 'void', resolved: 'void', references: {} },
          docs: 'A configurable event',
          docsTags: [{ name: 'config', text: 'true' }],
          detail: 'void',
        },
        {
          event: 'plainEvent',
          bubbles: true,
          cancelable: true,
          composed: true,
          complexType: { original: 'void', resolved: 'void', references: {} },
          docs: 'A plain event',
          docsTags: [],
          detail: 'void',
        },
      ],
      undefined,
      [
        {
          header: 'Configurable',
          content: (ev) => (ev.docsTags.some((t) => t.name === 'config') ? '✅' : '❌'),
        },
      ],
    ).join('\n');

    expect(markdown).toContain(
      '| Event         | Description          | Type                | Configurable |',
    );
    expect(markdown).toContain('`configEvent`');
    expect(markdown).toContain('✅');
    expect(markdown).toContain('`plainEvent`');
    expect(markdown).toContain('❌');
  });
});
