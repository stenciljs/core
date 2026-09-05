import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { generateComponentSkillMarkdown } from '../agent-skill/markdown-component';

/**
 * Helper to create a mock JsonDocsComponent with sensible defaults
 */
function createMockComponent(overrides: Partial<d.JsonDocsComponent> = {}): d.JsonDocsComponent {
  return {
    dirPath: '',
    fileName: 'my-component.tsx',
    filePath: 'src/my-component.tsx',
    readmePath: 'src/readme.md',
    usagesDir: 'src/usage',
    tag: 'my-component',
    readme: '',
    overview: '',
    usage: {},
    docs: '',
    docsTags: [],
    encapsulation: 'shadow',
    dependents: [],
    dependencies: [],
    dependencyGraph: {},
    props: [],
    methods: [],
    events: [],
    styles: [],
    slots: [],
    parts: [],
    customStates: [],
    listeners: [],
    ...overrides,
  };
}

describe('generateComponentSkillMarkdown', () => {
  it('renders a title and sections only for non-empty data', () => {
    const markdown = generateComponentSkillMarkdown(createMockComponent());

    expect(markdown.startsWith('# my-component')).toBe(true);
    expect(markdown).not.toContain('## Properties');
    expect(markdown).not.toContain('## Events');
    expect(markdown).not.toContain('## Methods');
    expect(markdown).not.toContain('## Slots');
    expect(markdown).not.toContain('## CSS Custom Properties');
    expect(markdown).not.toContain('## Shadow Parts');
    expect(markdown).not.toContain('## Usage');
  });

  it('renders overview, props, slots, parts, and usage sections when present', () => {
    const markdown = generateComponentSkillMarkdown(
      createMockComponent({
        overview: 'A reusable button.',
        props: [
          {
            name: 'variant',
            attr: 'variant',
            docs: 'The button style',
            default: "'primary'",
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
        slots: [{ name: '', docs: 'The button content' }],
        parts: [{ name: 'label', docs: 'The label element' }],
        usage: { basic: '```html\n<my-button variant="primary">Click</my-button>\n```' },
      }),
    );

    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('A reusable button.');
    expect(markdown).toContain('## Properties');
    expect(markdown).toContain('`variant`');
    expect(markdown).toContain('## Slots');
    expect(markdown).toContain('## Shadow Parts');
    expect(markdown).toContain('`"label"`');
    expect(markdown).toContain('## Usage');
    expect(markdown).toContain('<my-button variant="primary">Click</my-button>');
  });
});
