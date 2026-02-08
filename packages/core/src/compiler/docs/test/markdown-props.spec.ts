import { propsToMarkdown } from '../../docs/readme/markdown-props';

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
});
