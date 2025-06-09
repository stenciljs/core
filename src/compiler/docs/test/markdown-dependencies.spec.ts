import type * as d from '../../../declarations';
import { DEFAULT_TARGET_COMPONENT_STYLES } from '../../config/constants';
import { depsToMarkdown } from '../readme/markdown-dependencies';

describe('depsToMarkdown()', () => {
  it('should use default settings if docs.markdown configuration was not provided', () => {
    const mockConfig = {
      docs: {
        markdown: {
          targetComponent: {
            ...DEFAULT_TARGET_COMPONENT_STYLES,
          },
        },
      },
    } as d.ValidatedConfig;
    const md = depsToMarkdown(
      {
        dependencies: [],
        dependencyGraph: {
          's-test': ['s-test-dep1'],
        },
        dependents: [],
        docs: '',
        docsTags: [],
        encapsulation: undefined,
        events: [],
        listeners: [],
        methods: [],
        parts: [],
        props: [],
        readme: '',
        slots: [],
        styles: [],
        tag: '',
        usage: undefined,
      },
      [],
      mockConfig,
    );
    expect(md).toEqual([
      '## Dependencies',
      '',
      '### Graph',
      '```mermaid',
      'graph TD;',
      '  s-test --> s-test-dep1',
      `  style  fill:${DEFAULT_TARGET_COMPONENT_STYLES.background},stroke:${DEFAULT_TARGET_COMPONENT_STYLES.textColor},stroke-width:4px`,
      '```',
      '',
    ]);
  });

  it('should use provided background settings for generated dependencies graph', () => {
    const mockColor = '#445334';
    const mockConfig = {
      docs: {
        markdown: {
          targetComponent: {
            background: mockColor,
            textColor: DEFAULT_TARGET_COMPONENT_STYLES.textColor,
          },
        },
      },
    } as d.ValidatedConfig;
    const md = depsToMarkdown(
      {
        dependencies: [],
        dependencyGraph: {
          's-test': ['s-test-dep1'],
        },
        dependents: [],
        docs: '',
        docsTags: [],
        encapsulation: undefined,
        events: [],
        listeners: [],
        methods: [],
        parts: [],
        props: [],
        readme: '',
        slots: [],
        styles: [],
        tag: '',
        usage: undefined,
      },
      [],
      mockConfig,
    );
    expect(md).toEqual([
      '## Dependencies',
      '',
      '### Graph',
      '```mermaid',
      'graph TD;',
      '  s-test --> s-test-dep1',
      `  style  fill:${mockColor},stroke:${DEFAULT_TARGET_COMPONENT_STYLES.textColor},stroke-width:4px`,
      '```',
      '',
    ]);
  });

  it('should use provided text color settings for generated dependencies graph', () => {
    const mockColor = '#445334';
    const mockConfig = {
      docs: {
        markdown: {
          targetComponent: {
            background: DEFAULT_TARGET_COMPONENT_STYLES.background,
            textColor: mockColor,
          },
        },
      },
    } as d.ValidatedConfig;
    const md = depsToMarkdown(
      {
        dependencies: [],
        dependencyGraph: {
          's-test': ['s-test-dep1'],
        },
        dependents: [],
        docs: '',
        docsTags: [],
        encapsulation: undefined,
        events: [],
        listeners: [],
        methods: [],
        parts: [],
        props: [],
        readme: '',
        slots: [],
        styles: [],
        tag: '',
        usage: undefined,
      },
      [],
      mockConfig,
    );
    expect(md).toEqual([
      '## Dependencies',
      '',
      '### Graph',
      '```mermaid',
      'graph TD;',
      '  s-test --> s-test-dep1',
      `  style  fill:${DEFAULT_TARGET_COMPONENT_STYLES.background},stroke:${mockColor},stroke-width:4px`,
      '```',
      '',
    ]);
  });
});
