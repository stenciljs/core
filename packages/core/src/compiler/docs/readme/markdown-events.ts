import type * as d from '@stencil/core';

import { MarkdownTable } from './docs-util';

export const eventsToMarkdown = (
  events: d.JsonDocsEvent[],
  cmp?: d.JsonDocsComponent,
  customColumns: d.DocsReadmeCustomColumn<d.JsonDocsEvent>[] = [],
) => {
  const content: string[] = [];
  if (events.length === 0) {
    return content;
  }

  content.push(`## Events`);
  content.push(``);

  const table = new MarkdownTable();

  table.addHeader(['Event', 'Description', 'Type', ...customColumns.map((c) => c.header)]);

  events.forEach((ev) => {
    table.addRow([
      `\`${ev.event}\``,
      getDocsField(ev),
      `\`CustomEvent<${ev.detail}>\``,
      ...customColumns.map((c) => c.content(ev, cmp!)),
    ]);
  });

  content.push(...table.toMarkdown());
  content.push(``);
  content.push(``);

  return content;
};

const getDocsField = (prop: d.JsonDocsEvent) => {
  return `${
    prop.deprecation !== undefined
      ? `<span style="color:red">**[DEPRECATED]**</span> ${prop.deprecation}<br/><br/>`
      : ''
  }${prop.docs}`;
};
