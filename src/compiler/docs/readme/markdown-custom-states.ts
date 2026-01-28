import type * as d from '../../../declarations';
import { MarkdownTable } from './docs-util';

/**
 * Converts a list of Custom States metadata to a table written in Markdown
 * @param customStates the Custom States metadata to convert
 * @returns a list of strings that make up the Markdown table
 */
export const customStatesToMarkdown = (customStates: d.JsonDocsCustomState[]): ReadonlyArray<string> => {
  const content: string[] = [];
  if (customStates.length === 0) {
    return content;
  }

  content.push(`## Custom States`);
  content.push(``);

  const table = new MarkdownTable();
  table.addHeader(['State', 'Initial Value', 'Description']);

  customStates.forEach((state) => {
    table.addRow([`\`:state(${state.name})\``, state.initialValue ? '`true`' : '`false`', state.docs]);
  });

  content.push(...table.toMarkdown());
  content.push(``);
  content.push(``);

  return content;
};
