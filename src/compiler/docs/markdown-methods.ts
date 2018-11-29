import * as d from '../../declarations';
import { MarkdownTable } from './docs-util';


export function methodsToMarkdown(methods: d.JsonDocsMethod[]) {
  const content: string[] = [];
  if (methods.length === 0) {
    return content;
  }

  content.push(`## Methods`);
  content.push(``);

  methods.forEach(method => {
    content.push(`### \`${method.signature}\``);
    content.push(``);
    content.push(method.docs);
    content.push(``);

    if (method.parameters.length > 0) {
      const parmsTable = new MarkdownTable();

      parmsTable.addHeader(['Name', 'Type', 'Description']);

      method.parameters.forEach(({ name, type, docs }) => {
        parmsTable.addRow(['`' + name + '`', '`' + type + '`', docs]);
      });

      content.push(`#### Parameters`);
      content.push(``);
      content.push(...parmsTable.toMarkdown());
      content.push(``);
    }

    if (method.returns) {
      content.push(`#### Returns`);
      content.push(``);
      content.push(`Type: \`${method.returns.type}\``);
      content.push(``);
      content.push(method.returns.docs);
      content.push(``);
    }
  });

  content.push(``);

  return content;
}
