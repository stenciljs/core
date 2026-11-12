import { describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockValidatedConfig } from '../../../../testing';
import { mockCompilerCtx } from '../../../../testing/compiler';
import { generateJsonDocs } from '../index';

describe('generateJsonDocs', () => {
  const baseComponent: d.JsonDocsComponent = {
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
  };

  it('carries cssOnly: true through to the written JSON for a CSS-only component', async () => {
    const config = mockValidatedConfig();
    const compilerCtx = mockCompilerCtx(config);
    vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue('export interface JsonDocs {}');
    const writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');

    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [{ ...baseComponent, tag: 'my-badge', cssOnly: true }],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsJson[] = [
      { type: 'docs-json', file: '/output/docs.json' },
    ];

    await generateJsonDocs(config, compilerCtx, docsData, outputTargets);

    const written = JSON.parse(writeFileSpy.mock.calls[0][1] as string);
    expect(written.components[0].cssOnly).toBe(true);
  });

  it('omits cssOnly for an ordinary component', async () => {
    const config = mockValidatedConfig();
    const compilerCtx = mockCompilerCtx(config);
    vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue('export interface JsonDocs {}');
    const writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');

    const docsData: d.JsonDocs = {
      timestamp: 'test',
      compiler: { name: '@stencil/core', version: '1.0.0', typescriptVersion: '4.0.0' },
      components: [baseComponent],
      typeLibrary: {},
    };
    const outputTargets: d.OutputTargetDocsJson[] = [
      { type: 'docs-json', file: '/output/docs.json' },
    ];

    await generateJsonDocs(config, compilerCtx, docsData, outputTargets);

    const written = JSON.parse(writeFileSpy.mock.calls[0][1] as string);
    expect(written.components[0].cssOnly).toBeUndefined();
  });
});
