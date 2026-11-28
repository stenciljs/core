import type * as d from '@stencil/core';

import { MarkdownTable } from './docs-util';

export const stylesToMarkdown = (styles: d.JsonDocsStyle[]) => {
  const content: string[] = [];
  if (styles.length === 0) {
    return content;
  }

  content.push(`## CSS Custom Properties`);
  content.push(``);

  // `syntax`/`default` only come from native `@property` registrations
  const hasRegistrations = styles.some((s) => s.syntax || s.default);
  const code = (text: string | undefined) => (text ? `\`${text}\`` : '');

  const table = new MarkdownTable();
  table.addHeader(
    hasRegistrations ? ['Name', 'Description', 'Syntax', 'Default'] : ['Name', 'Description'],
  );

  styles.forEach((style) => {
    const row = [code(style.name), style.docs];
    table.addRow(hasRegistrations ? [...row, code(style.syntax), code(style.default)] : row);
  });

  content.push(...table.toMarkdown());
  content.push(``);
  content.push(``);

  return content;
};
