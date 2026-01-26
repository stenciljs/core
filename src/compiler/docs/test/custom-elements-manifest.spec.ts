import { mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';

import type * as d from '../../../declarations';
import { generateCustomElementsManifestDocs } from '../custom-elements-manifest';

describe('custom-elements-manifest', () => {
  let compilerCtx: d.CompilerCtx;
  let writeFileSpy: jest.SpyInstance;

  beforeEach(() => {
    const config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    writeFileSpy = jest.spyOn(compilerCtx.fs, 'writeFile');
  });

  afterEach(() => {
    writeFileSpy.mockRestore();
  });

  it('does nothing when no custom-elements-manifest output targets are configured', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [],
      typeLibrary: {},
    };

    await generateCustomElementsManifestDocs(compilerCtx, docsData, []);

    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('generates manifest with correct schema version', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    expect(writtenContent.schemaVersion).toBe('2.1.0');
    expect(writtenContent.modules).toEqual([]);
  });

  it('generates module for each component file', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/components/my-component/my-component.tsx',
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    expect(writtenContent.modules).toHaveLength(1);
    expect(writtenContent.modules[0].kind).toBe('javascript-module');
    expect(writtenContent.modules[0].path).toBe('src/components/my-component/my-component.tsx');
  });

  it('converts tag name to PascalCase class name', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-awesome-component',
          filePath: 'src/my-component.tsx',
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.name).toBe('MyAwesomeComponent');
    expect(declaration.tagName).toBe('my-awesome-component');
  });

  it('includes component description', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          docs: 'This is a test component',
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.description).toBe('This is a test component');
  });

  it('includes attributes from props with attr set', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          props: [
            {
              name: 'firstName',
              attr: 'first-name',
              type: 'string',
              docs: 'The first name',
              default: "'John'",
              mutable: false,
              reflectToAttr: true,
              docsTags: [],
              values: [],
              optional: false,
              required: false,
              getter: false,
              setter: false,
            },
          ],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.attributes).toHaveLength(1);
    expect(declaration.attributes[0]).toEqual({
      name: 'first-name',
      description: 'The first name',
      type: { text: 'string' },
      default: "'John'",
      fieldName: 'firstName',
    });
  });

  it('includes members (fields) from props', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          props: [
            {
              name: 'count',
              type: 'number',
              docs: 'The count value',
              default: '0',
              mutable: false,
              reflectToAttr: false,
              docsTags: [],
              values: [],
              optional: false,
              required: false,
              getter: false,
              setter: false,
            },
          ],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    const field = declaration.members.find((m: any) => m.kind === 'field');
    expect(field).toBeDefined();
    expect(field.name).toBe('count');
    expect(field.type).toEqual({ text: 'number' });
    expect(field.readonly).toBe(true);
  });

  it('includes methods', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          methods: [
            {
              name: 'doSomething',
              docs: 'Does something',
              docsTags: [],
              returns: { type: 'Promise<void>', docs: 'Returns nothing' },
              signature: 'doSomething(value: string) => Promise<void>',
              parameters: [{ name: 'value', type: 'string', docs: 'The value to use' }],
              complexType: {
                signature: '(value: string) => Promise<void>',
                parameters: [{ name: 'value', type: 'string', docs: 'The value to use' }],
                return: 'Promise<void>',
                references: {},
              },
            },
          ],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    const method = declaration.members.find((m: any) => m.kind === 'method');
    expect(method).toBeDefined();
    expect(method.name).toBe('doSomething');
    expect(method.description).toBe('Does something');
    expect(method.parameters).toHaveLength(1);
    expect(method.return.type).toEqual({ text: 'Promise<void>' });
  });

  it('includes events', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          events: [
            {
              event: 'myEvent',
              docs: 'Fired when something happens',
              detail: 'string',
              bubbles: true,
              cancelable: true,
              composed: true,
              docsTags: [],
              complexType: {
                original: 'string',
                resolved: 'string',
                references: {},
              },
            },
          ],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.events).toHaveLength(1);
    expect(declaration.events[0]).toEqual({
      name: 'myEvent',
      description: 'Fired when something happens',
      type: { text: 'CustomEvent<string>' },
    });
  });

  it('includes slots', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          slots: [
            { name: '', docs: 'Default slot content' },
            { name: 'header', docs: 'Header slot' },
          ],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.slots).toHaveLength(2);
    expect(declaration.slots[0]).toEqual({ name: '', description: 'Default slot content' });
    expect(declaration.slots[1]).toEqual({ name: 'header', description: 'Header slot' });
  });

  it('includes CSS parts', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          parts: [{ name: 'button', docs: 'The button element' }],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.cssParts).toHaveLength(1);
    expect(declaration.cssParts[0]).toEqual({ name: 'button', description: 'The button element' });
  });

  it('includes CSS custom properties', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          styles: [
            { name: '--my-color', annotation: 'prop', docs: 'The primary color', mode: 'light' },
            { name: '--my-other', annotation: 'other', docs: 'Not a prop', mode: 'dark' },
          ],
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.cssProperties).toHaveLength(1);
    expect(declaration.cssProperties[0]).toEqual({ name: '--my-color', description: 'The primary color' });
  });

  it('includes deprecation info', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
          deprecation: 'Use new-component instead',
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const declaration = writtenContent.modules[0].declarations[0];
    expect(declaration.deprecated).toBe('Use new-component instead');
  });

  it('generates exports for each component', async () => {
    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [
        createMockComponent({
          tag: 'my-component',
          filePath: 'src/my-component.tsx',
        }),
      ],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsCustomElementsManifest[] = [
      { type: 'docs-custom-elements-manifest', file: '/output/custom-elements.json' },
    ];

    await generateCustomElementsManifestDocs(compilerCtx, docsData, outputTargets);

    const writtenContent = JSON.parse(writeFileSpy.mock.calls[0][1]);
    const exports = writtenContent.modules[0].exports;
    expect(exports).toHaveLength(2);

    const jsExport = exports.find((e: any) => e.kind === 'js');
    expect(jsExport).toBeDefined();
    expect(jsExport.name).toBe('MyComponent');

    const ceExport = exports.find((e: any) => e.kind === 'custom-element-definition');
    expect(ceExport).toBeDefined();
    expect(ceExport.name).toBe('my-component');
  });
});

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
    listeners: [],
    ...overrides,
  };
}
