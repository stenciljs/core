import type * as d from '@stencil/core';

import { MarkdownTable } from './docs-util';

export const propsToMarkdown = (
  props: d.JsonDocsProp[],
  cmp?: d.JsonDocsComponent,
  customColumns: d.DocsReadmeCustomColumn<d.JsonDocsProp>[] = [],
) => {
  const content: string[] = [];
  if (props.length === 0) {
    return content;
  }

  // A CSS-only component has no backing JS class. It has no properties
  const showPropertyColumn = !cmp?.cssOnly;

  content.push(`## Properties`);
  content.push(``);

  const table = new MarkdownTable();

  table.addHeader([
    ...(showPropertyColumn ? ['Property'] : []),
    'Attribute',
    'Description',
    'Type',
    'Default',
    ...customColumns.map((c) => c.header),
  ]);

  props.forEach((prop) => {
    table.addRow([
      ...(showPropertyColumn ? [getPropertyField(prop)] : []),
      getAttributeField(prop),
      getDocsField(prop),
      getTypeField(prop),
      getDefaultValueField(prop, cmp),
      ...customColumns.map((c) => c.content(prop, cmp!)),
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

const getDefaultValueField = (prop: d.JsonDocsProp, cmp?: d.JsonDocsComponent) => {
  if (prop.default === undefined) {
    return cmp?.cssOnly ? '--' : '`undefined`';
  }
  return prop.default.includes('`') ? `\`\` ${prop.default} \`\`` : `\`${prop.default}\``;
};
