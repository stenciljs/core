import { describe, expect, it } from 'vitest';

import { propsToMarkdown } from '../readme/markdown-props';

describe('markdown props', () => {
  it('advanced union types', () => {
    const markdown = propsToMarkdown([
      {
        name: 'hello',
        attr: 'hello',
        docs: 'This is a prop',
        default: 'false',
        type: 'boolean | string',
        mutable: false,
        optional: false,
        required: false,
        reflectToAttr: false,
        docsTags: [],
        values: [],
        getter: false,
        setter: false,
      },
      {
        name: 'hello',
        attr: undefined,
        docs: 'This is a prop',
        default: 'false',
        type: 'boolean | string',
        mutable: false,
        optional: false,
        required: false,
        reflectToAttr: false,
        docsTags: [],
        values: [],
        getter: false,
        setter: false,
      },
    ]).join('\n');
    expect(markdown).toEqual(`## Properties

| Property | Attribute | Description    | Type                | Default |
| -------- | --------- | -------------- | ------------------- | ------- |
| \`hello\`  | \`hello\`   | This is a prop | \`boolean \\| string\` | \`false\` |
| \`hello\`  | --        | This is a prop | \`boolean \\| string\` | \`false\` |

`);
  });

  it('escapes template literal types', () => {
    const markdown = propsToMarkdown([
      {
        name: 'width',
        attr: 'width',
        docs: 'Width of the button',
        default: 'undefined',
        type: '`${number}px` | `${number}%`',
        mutable: false,
        optional: false,
        required: false,
        reflectToAttr: false,
        docsTags: [],
        values: [],
        getter: false,
        setter: false,
      },
    ]).join('\n');

    expect(markdown).toEqual(`## Properties

| Property | Attribute | Description         | Type                                | Default     |
| -------- | --------- | ------------------- | ----------------------------------- | ----------- |
| \`width\`  | \`width\`   | Width of the button | \`\` \`\${number}px\` \\| \`\${number}%\` \`\` | \`undefined\` |

`);
  });

  it('escapes backticks in default value', () => {
    const markdown = propsToMarkdown([
      {
        name: 'quote',
        attr: 'quote',
        docs: 'Quote character',
        default: "'`'",
        type: 'string',
        mutable: false,
        optional: false,
        required: false,
        reflectToAttr: false,
        docsTags: [],
        values: [],
        getter: false,
        setter: false,
      },
    ]).join('\n');

    expect(markdown).toEqual(`## Properties

| Property | Attribute | Description     | Type     | Default   |
| -------- | --------- | --------------- | -------- | --------- |
| \`quote\`  | \`quote\`   | Quote character | \`string\` | \`\` '\`' \`\` |

`);
  });

  it('outputs `undefined` in default column when `prop.default` is undefined', () => {
    const markdown = propsToMarkdown([
      {
        name: 'first',
        attr: 'first',
        docs: 'First name',
        default: undefined,
        type: 'string',
        mutable: false,
        optional: false,
        required: false,
        reflectToAttr: false,
        docsTags: [],
        values: [],
        getter: false,
        setter: false,
      },
    ]).join('\n');

    expect(markdown).toBe(`## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| \`first\`  | \`first\`   | First name  | \`string\` | \`undefined\` |

`);
  });

  it('renders custom columns driven by docsTags, in array order', () => {
    const markdown = propsToMarkdown(
      [
        {
          name: 'configurable',
          attr: 'configurable',
          docs: 'A configurable prop',
          default: 'undefined',
          type: 'string',
          mutable: false,
          optional: false,
          required: false,
          reflectToAttr: false,
          docsTags: [{ name: 'config', text: 'true' }],
          values: [],
          getter: false,
          setter: false,
        },
        {
          name: 'plain',
          attr: 'plain',
          docs: 'A plain prop',
          default: 'undefined',
          type: 'string',
          mutable: false,
          optional: false,
          required: false,
          reflectToAttr: false,
          docsTags: [],
          values: [],
          getter: false,
          setter: false,
        },
      ],
      undefined,
      [
        {
          header: 'Configurable',
          content: (prop) => (prop.docsTags.some((t) => t.name === 'config') ? '✅' : '❌'),
        },
      ],
    ).join('\n');

    expect(markdown).toEqual(`## Properties

| Property       | Attribute      | Description         | Type     | Default     | Configurable |
| -------------- | -------------- | ------------------- | -------- | ----------- | ------------ |
| \`configurable\` | \`configurable\` | A configurable prop | \`string\` | \`undefined\` | ✅            |
| \`plain\`        | \`plain\`        | A plain prop        | \`string\` | \`undefined\` | ❌            |

`);
  });
});
