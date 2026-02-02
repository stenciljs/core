import type * as d from '../../../declarations';
import { generateMarkdown, generateReadme } from '../readme/output-docs';

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
          { name: '--background', docs: 'Background color', annotation: 'prop' as const, mode: undefined },
          { name: '--color', docs: 'Text color', annotation: 'prop' as const, mode: undefined },
        ],
        existingProps: undefined,
        shouldContain: ['## CSS Custom Properties', '`--background`', 'Background color', '`--color`', 'Text color'],
        shouldNotContain: [],
      },
      {
        name: 'existing CSS props when component styles are empty',
        componentStyles: [],
        existingProps: [
          {
            name: '--bg',
            docs: 'Defaults to var(--nano-color-blue-cerulean-1000);',
            annotation: 'prop' as const,
            mode: undefined,
          },
          { name: '--text-color', docs: 'Text color of the component', annotation: 'prop' as const, mode: undefined },
        ],
        shouldContain: ['## CSS Custom Properties', '`--bg`', 'Defaults to var(--nano-color-blue-cerulean-1000);'],
        shouldNotContain: [],
      },
      {
        name: 'no CSS section when both styles and existing props are empty',
        componentStyles: [],
        existingProps: undefined,
        shouldContain: [],
        shouldNotContain: ['## CSS Custom Properties'],
      },
      {
        name: 'component styles over existing CSS props when both available',
        componentStyles: [
          { name: '--new-prop', docs: 'New property from build', annotation: 'prop' as const, mode: undefined },
        ],
        existingProps: [
          {
            name: '--old-prop',
            docs: 'Old property from previous build',
            annotation: 'prop' as const,
            mode: undefined,
          },
        ],
        shouldContain: ['`--new-prop`', 'New property from build'],
        shouldNotContain: ['`--old-prop`', 'Old property from previous build'],
      },
    ])('should use $name', ({ componentStyles, existingProps, shouldContain, shouldNotContain }) => {
      const component: d.JsonDocsComponent = {
        ...mockComponent,
        styles: componentStyles,
      };

      const markdown = generateMarkdown('# my-component', component, [], mockReadmeOutput, undefined, existingProps);

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
        styles: [],
      };

      const existingCssProps: d.JsonDocsStyle[] = [
        {
          name: '--bg',
          docs: 'Defaults to var(--nano-color-blue-cerulean-1000); with | pipes',
          annotation: 'prop',
          mode: undefined,
        },
      ];

      const markdown = generateMarkdown('# my-component', component, [], mockReadmeOutput, undefined, existingCssProps);

      // Pipe characters are escaped in markdown tables
      expect(markdown).toContain('Defaults to var(--nano-color-blue-cerulean-1000); with \\| pipes');
    });
  });

  describe('generateReadme - docs-only mode detection', () => {
    const mockCompilerCtx: d.CompilerCtx = {
      fs: {
        readFile: async (_path: string) => {
          // Mock existing README with CSS props
          return `# my-component

<!-- Auto Generated Below -->

## CSS Custom Properties

| Name | Description |
| ---- | ----------- |
| \`--existing-prop\` | This was preserved from previous build |

----------------------------------------------

*Built with StencilJS*
`;
        },
        writeFile: async (_path: string, _content: string) => {
          return { changedContent: true, queuedWrite: false };
        },
        access: async (_path: string) => true,
      },
    } as any;

    const mockConfig: d.ValidatedConfig = {
      rootDir: '/project',
      srcDir: '/project/src',
      logger: {
        info: () => {},
      },
    } as any;

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
      styles: [], // Empty styles
      slots: [],
      parts: [],
      dependents: [],
      dependencies: [],
      dependencyGraph: {},
      customStates: [],
      readme: '# my-component',
    };

    it('should preserve CSS props when in docs-only mode (stencil docs)', async () => {
      const docsOnlyConfig: d.ValidatedConfig = {
        ...mockConfig,
        outputTargets: [
          { type: 'docs-readme', dir: '/project/src' },
          { type: 'docs-json', file: 'docs.json' },
        ],
      };

      let writtenContent = '';
      const mockCtx = {
        ...mockCompilerCtx,
        fs: {
          ...mockCompilerCtx.fs,
          writeFile: async (_path: string, content: string) => {
            writtenContent = content;
            return { changedContent: true, queuedWrite: false };
          },
        },
      };

      await generateReadme(
        docsOnlyConfig,
        mockCtx as any,
        [{ type: 'docs-readme', dir: '/project/src', footer: '*Built with StencilJS*' }],
        mockComponent,
        [],
      );

      // Should preserve the existing CSS prop
      expect(writtenContent).toContain('## CSS Custom Properties');
      expect(writtenContent).toContain('`--existing-prop`');
      expect(writtenContent).toContain('This was preserved from previous build');
    });

    it('should NOT preserve CSS props when in full build mode (stencil build --docs)', async () => {
      const fullBuildConfig: d.ValidatedConfig = {
        ...mockConfig,
        outputTargets: [
          { type: 'docs-readme', dir: '/project/src' },
          { type: 'www', dir: '/project/www' }, // Non-docs output target
          { type: 'dist', dir: '/project/dist' }, // Another build target
        ],
      };

      let writtenContent = '';
      const mockCtx = {
        ...mockCompilerCtx,
        fs: {
          ...mockCompilerCtx.fs,
          writeFile: async (_path: string, content: string) => {
            writtenContent = content;
            return { changedContent: true, queuedWrite: false };
          },
        },
      };

      await generateReadme(
        fullBuildConfig,
        mockCtx as any,
        [{ type: 'docs-readme', dir: '/project/src', footer: '*Built with StencilJS*' }],
        mockComponent,
        [],
      );

      // Should NOT preserve CSS props because we're in full build mode
      expect(writtenContent).not.toContain('## CSS Custom Properties');
      expect(writtenContent).not.toContain('`--existing-prop`');
    });
  });
});
