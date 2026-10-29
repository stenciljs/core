import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { stylesToMarkdown } from '../readme/markdown-css-props';

const style = (s: Partial<d.JsonDocsStyle>): d.JsonDocsStyle => ({
  name: '--x',
  docs: '',
  annotation: 'prop',
  mode: undefined,
  ...s,
});

describe('markdown css props', () => {
  it('renders name and description only when no property has @property data', () => {
    const markdown = stylesToMarkdown([
      style({ name: '--bg', docs: 'Background' }),
      style({ name: '--fg', docs: 'Text' }),
    ]).join('\n');

    expect(markdown).toEqual(`## CSS Custom Properties

| Name   | Description |
| ------ | ----------- |
| \`--bg\` | Background  |
| \`--fg\` | Text        |

`);
  });

  it('adds Syntax and Default columns when any property has them', () => {
    const markdown = stylesToMarkdown([
      style({ name: '--radius', docs: 'Corner radius', syntax: '<length>', default: '4px' }),
      style({ name: '--fg', docs: 'Text' }),
    ]).join('\n');

    expect(markdown).toEqual(`## CSS Custom Properties

| Name       | Description   | Syntax     | Default |
| ---------- | ------------- | ---------- | ------- |
| \`--radius\` | Corner radius | \`<length>\` | \`4px\`   |
| \`--fg\`     | Text          |            |         |

`);
  });

  it('returns nothing for no styles', () => {
    expect(stylesToMarkdown([])).toEqual([]);
  });
});
