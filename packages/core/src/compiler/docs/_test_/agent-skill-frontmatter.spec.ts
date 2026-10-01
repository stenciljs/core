import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import {
  buildSkillDescription,
  escapeYamlString,
  firstSentence,
  generateSkillMarkdown,
  toSkillName,
} from '../agent-skill/frontmatter';

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

function createMockDocsData(overrides: Partial<d.JsonDocs> = {}): d.JsonDocs {
  return {
    timestamp: 'test',
    compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
    components: [],
    typeLibrary: {},
    ...overrides,
  };
}

describe('firstSentence', () => {
  it('returns an empty string for undefined/empty input', () => {
    expect(firstSentence(undefined)).toBe('');
    expect(firstSentence('')).toBe('');
    expect(firstSentence('   ')).toBe('');
  });

  it('extracts the first sentence when there is terminal punctuation', () => {
    expect(firstSentence('Install the library. Then import components.')).toBe(
      'Install the library.',
    );
  });

  it('falls back to the full trimmed text when there is no terminal punctuation', () => {
    expect(firstSentence('  a phrase with no punctuation  ')).toBe('a phrase with no punctuation');
  });

  it('truncates long sentences to maxLen with an ellipsis', () => {
    const long = 'a'.repeat(300) + '.';
    const result = firstSentence(long, 50);
    expect(result.length).toBe(50);
    expect(result.endsWith('…')).toBe(true);
  });

  it('matches across newlines when the first sentence spans multiple lines', () => {
    expect(firstSentence('Install\nthe library. Then import components.')).toBe(
      'Install\nthe library.',
    );
  });
});

describe('toSkillName', () => {
  it('kebab-cases a namespace', () => {
    expect(toSkillName('MyDesignSystem')).toBe('mydesignsystem');
    expect(toSkillName('My Design System')).toBe('my-design-system');
    expect(toSkillName('my_design_system')).toBe('my-design-system');
  });

  it('trims leading/trailing dashes produced by non-alphanumeric edges', () => {
    expect(toSkillName('--My System--')).toBe('my-system');
  });

  it('falls back to "skill" when the sanitized result is empty', () => {
    expect(toSkillName('***')).toBe('skill');
    expect(toSkillName('')).toBe('skill');
  });
});

describe('escapeYamlString', () => {
  it('returns plain strings unchanged', () => {
    expect(escapeYamlString('my-design-system')).toBe('my-design-system');
  });

  it('quotes and escapes strings containing YAML-significant characters', () => {
    expect(escapeYamlString('Use: this library')).toBe('"Use: this library"');
    expect(escapeYamlString('says "hello"')).toBe('"says \\"hello\\""');
  });

  it('quotes the empty string', () => {
    expect(escapeYamlString('')).toBe('""');
  });
});

describe('buildSkillDescription', () => {
  it('prefers the first sentence of project-level usage content when present', () => {
    const description = buildSkillDescription(
      [createMockComponent({ tag: 'my-button' })],
      'my-design-system',
      { installation: 'Install via npm. Then import the components you need.' },
    );
    expect(description).toBe('Install via npm.');
  });

  it('falls back to a generated sentence from component tags when no project usage exists', () => {
    const description = buildSkillDescription(
      [createMockComponent({ tag: 'my-button' }), createMockComponent({ tag: 'my-input' })],
      'my-design-system',
      undefined,
    );
    expect(description).toBe(
      'Use when building UI with the my-design-system component library. Provides API reference and usage examples for its 2 components: my-button, my-input.',
    );
  });

  it('falls back to the generated sentence when project usage is an empty object', () => {
    const description = buildSkillDescription(
      [createMockComponent({ tag: 'my-button' })],
      'my-design-system',
      {},
    );
    expect(description).toBe(
      'Use when building UI with the my-design-system component library. Provides API reference and usage examples for its 1 component: my-button.',
    );
  });
});

describe('generateSkillMarkdown', () => {
  it('renders frontmatter, an intro (when project usage exists), and a component index', () => {
    const docsData = createMockDocsData({
      components: [
        createMockComponent({ tag: 'my-button', overview: 'A clickable button.' }),
        createMockComponent({ tag: 'my-input', overview: '' }),
      ],
      usage: { installation: 'Install via npm.' },
    });
    const outputTarget: d.OutputTargetDocsAgentSkill = {
      type: 'docs-agent-skill',
      dir: '/dist/skill',
      name: 'my-design-system',
    };

    const markdown = generateSkillMarkdown(docsData, outputTarget);

    expect(markdown).toContain('---\nname: my-design-system\ndescription: Install via npm.\n---');
    expect(markdown).toContain('# my-design-system');
    expect(markdown).toContain('## Usage');
    expect(markdown).toContain('Install via npm.');
    expect(markdown).toContain('## Components');
    expect(markdown).toContain('- [my-button](components/my-button.md) — A clickable button.');
    expect(markdown).toContain('- [my-input](components/my-input.md)');
    // components are sorted by tag, and the one with no overview has no trailing dash
    expect(markdown.indexOf('my-button')).toBeLessThan(markdown.indexOf('my-input'));
  });

  it('honors an explicit description over the auto-generated one', () => {
    const docsData = createMockDocsData({
      components: [createMockComponent({ tag: 'my-button' })],
    });
    const outputTarget: d.OutputTargetDocsAgentSkill = {
      type: 'docs-agent-skill',
      dir: '/dist/skill',
      name: 'my-design-system',
      description: 'A hand-written description.',
    };

    const markdown = generateSkillMarkdown(docsData, outputTarget);

    expect(markdown).toContain('description: A hand-written description.');
  });
});
