import type * as d from '../../../declarations';
import { MarkdownTable } from './docs-util';

export const stylesToMarkdown = (styles: d.JsonDocsStyle[]) => {
  const content: string[] = [];
  if (styles.length === 0) {
    return content;
  }

  content.push(`## CSS Custom Properties`);
  content.push(``);

  const table = new MarkdownTable();
  table.addHeader(['Name', 'Description']);

  styles.forEach((style) => {
    table.addRow([`\`${style.name}\``, style.docs]);
  });

  content.push(...table.toMarkdown());
  content.push(``);
  content.push(``);

  return content;
};
