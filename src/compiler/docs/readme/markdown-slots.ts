import type * as d from '../../../declarations';
import { MarkdownTable } from './docs-util';

/**
 * Converts a list of Slots metadata to a table written in Markdown
 * @param slots the Slots metadata to convert
 * @returns a list of strings that make up the Markdown table
 */
export const slotsToMarkdown = (slots: d.JsonDocsSlot[]): ReadonlyArray<string> => {
  const content: string[] = [];
  if (slots.length === 0) {
    return content;
  }

  content.push(`## Slots`);
  content.push(``);

  const table = new MarkdownTable();
  table.addHeader(['Slot', 'Description']);

  slots.forEach((style) => {
    table.addRow([style.name === '' ? '' : `\`"${style.name}"\``, style.docs]);
  });

  content.push(...table.toMarkdown());
  content.push(``);
  content.push(``);

  return content;
};
