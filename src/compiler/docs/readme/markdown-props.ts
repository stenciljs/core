import type * as d from '../../../declarations';
import { MarkdownTable } from './docs-util';

export const propsToMarkdown = (props: d.JsonDocsProp[]) => {
  const content: string[] = [];
  if (props.length === 0) {
    return content;
  }

  content.push(`## Properties`);
  content.push(``);

  const table = new MarkdownTable();

  table.addHeader(['Property', 'Attribute', 'Description', 'Type', 'Default']);

  props.forEach((prop) => {
    table.addRow([
      getPropertyField(prop),
      getAttributeField(prop),
      getDocsField(prop),
      getTypeField(prop),
      getDefaultValueField(prop),
    ]);
  });

  content.push(...table.toMarkdown());
  content.push(``);
  content.push(``);

  return content;
};

const getPropertyField = (prop: d.JsonDocsProp) => {
  return `\`${prop.name}\`${prop.required ? ' _(required)_' : ''}`;
};

const getAttributeField = (prop: d.JsonDocsProp) => {
  return prop.attr ? `\`${prop.attr}\`` : '--';
};

const getDocsField = (prop: d.JsonDocsProp) => {
  return `${
    prop.deprecation !== undefined
      ? `<span style="color:red">**[DEPRECATED]**</span> ${prop.deprecation}<br/><br/>`
      : ''
  }${prop.docs}`;
};

const getTypeField = (prop: d.JsonDocsProp) => {
  return prop.type.includes('`') ? `\`\` ${prop.type} \`\`` : `\`${prop.type}\``;
};

const getDefaultValueField = (prop: d.JsonDocsProp) => {
  return prop.default?.includes('`') ? `\`\` ${prop.default} \`\`` : `\`${prop.default}\``;
};
