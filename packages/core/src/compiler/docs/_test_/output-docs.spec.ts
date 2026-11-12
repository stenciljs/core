import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { generateMarkdown } from '../readme/output-docs';

describe('css-props to markdown', () => {
  describe('generateMarkdown', () => {
    const mockReadmeOutput: d.OutputTargetDocsReadme = {
      type: 'docs-readme',
      footer: '*Built with StencilJS*',
    };

    const mockComponent: d.JsonDocsComponent = {
      tag: 'my-component',
      filePath: 'src/components/my-component/my-component.tsx',
      fileName: 'my-component.tsx',
      dirPath: 'src/components/my-component',
      readmePath: 'src/components/my-component/readme.md',
      usagesDir: 'src/components/my-component/usage',
      encapsulation: 'shadow',
      docs: '',
      docsTags: [],
      usage: {},
      props: [],
      methods: [],
      events: [],
      listeners: [],
      styles: [],
      slots: [],
      parts: [],
      dependents: [],
      dependencies: [],
      dependencyGraph: {},
      customStates: [],
      readme: '',
    };

    it.each([
      {
        name: 'component styles when available',
        componentStyles: [
          {
            name: '--background',
            docs: 'Background color',
            annotation: 'prop' as const,
            mode: undefined,
          },
          { name: '--color', docs: 'Text color', annotation: 'prop' as const, mode: undefined },
        ],
        shouldContain: [
          '## CSS Custom Properties',
          '`--background`',
          'Background color',
          '`--color`',
          'Text color',
        ],
        shouldNotContain: [],
      },
      {
        name: 'preserved CSS props (already in component.styles)',
        componentStyles: [
          {
            name: '--bg',
            docs: 'Defaults to var(--nano-color-blue-cerulean-1000);',
            annotation: 'prop' as const,
            mode: undefined,
          },
          {
            name: '--text-color',
            docs: 'Text color of the component',
            annotation: 'prop' as const,
            mode: undefined,
          },
        ],
        shouldContain: [
          '## CSS Custom Properties',
          '`--bg`',
          'Defaults to var(--nano-color-blue-cerulean-1000);',
        ],
        shouldNotContain: [],
      },
      {
        name: 'no CSS section when styles are empty',
        componentStyles: [],
        shouldContain: [],
        shouldNotContain: ['## CSS Custom Properties'],
      },
      {
        name: 'updated component styles',
        componentStyles: [
          {
            name: '--new-prop',
            docs: 'New property from build',
            annotation: 'prop' as const,
            mode: undefined,
          },
        ],
        shouldContain: ['`--new-prop`', 'New property from build'],
        shouldNotContain: [],
      },
    ])('should use $name', ({ componentStyles, shouldContain, shouldNotContain }) => {
      const component: d.JsonDocsComponent = {
        ...mockComponent,
        styles: componentStyles,
      };

      const markdown = generateMarkdown('# my-component', component, [], mockReadmeOutput);

      shouldContain.forEach((expected) => {
        expect(markdown).toContain(expected);
      });

      shouldNotContain.forEach((unexpected) => {
        expect(markdown).not.toContain(unexpected);
      });
    });

    it('should escape special characters in CSS prop descriptions', () => {
      const component: d.JsonDocsComponent = {
        ...mockComponent,
        styles: [
          {
            name: '--bg',
            docs: 'Defaults to var(--nano-color-blue-cerulean-1000); with | pipes',
            annotation: 'prop',
            mode: undefined,
          },
        ],
      };

      const markdown = generateMarkdown('# my-component', component, [], mockReadmeOutput);

      // Pipe characters are escaped in markdown tables
      expect(markdown).toContain(
        'Defaults to var(--nano-color-blue-cerulean-1000); with \\| pipes',
      );
    });

    describe('customColumns', () => {
      it('renders extra props/events columns wired through readmeOutput.customColumns', () => {
        const readmeOutput: d.OutputTargetDocsReadme = {
          type: 'docs-readme',
          footer: '*Built with StencilJS*',
          customColumns: {
            props: [
              {
                header: 'Configurable',
                content: (prop) => (prop.docsTags.some((t) => t.name === 'config') ? '✅' : '❌'),
              },
            ],
            events: [
              {
                header: 'Internal',
                content: (ev) => (ev.docsTags.some((t) => t.name === 'internal') ? '✅' : '❌'),
              },
            ],
          },
        };

        const component: d.JsonDocsComponent = {
          ...mockComponent,
          props: [
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
          ],
          events: [
            {
              event: 'myEvent',
              bubbles: true,
              cancelable: true,
              composed: true,
              complexType: { original: 'void', resolved: 'void', references: {} },
              docs: 'An event',
              docsTags: [],
              detail: 'void',
            },
          ],
        };

        const markdown = generateMarkdown('# my-component', component, [], readmeOutput);

        expect(markdown).toContain('## Properties');
        expect(markdown).toContain('Configurable');
        expect(markdown).toContain('✅');
        expect(markdown).toContain('## Events');
        expect(markdown).toContain('Internal');
        expect(markdown).toContain('❌');
      });
    });
  });
});
