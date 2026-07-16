import { mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, MockInstance, beforeEach, afterEach, vi } from 'vitest';
import type * as d from '@stencil/core';

import { generateAgentSkillDocs } from '../agent-skill';

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

describe('agent-skill', () => {
  let compilerCtx: d.CompilerCtx;
  let writeFileSpy: MockInstance;

  beforeEach(() => {
    const config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');
  });

  afterEach(() => {
    writeFileSpy.mockRestore();
  });

  it('does nothing when no docs-agent-skill output targets are configured', async () => {
    await generateAgentSkillDocs(compilerCtx, createMockDocsData(), []);

    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('writes SKILL.md and one file per component', async () => {
    const docsData = createMockDocsData({
      components: [
        createMockComponent({ tag: 'my-button' }),
        createMockComponent({ tag: 'my-input' }),
      ],
    });
    const outputTargets: d.OutputTargetDocsAgentSkill[] = [
      { type: 'docs-agent-skill', dir: '/dist/skill', name: 'my-design-system' },
    ];

    await generateAgentSkillDocs(compilerCtx, docsData, outputTargets);

    expect(writeFileSpy).toHaveBeenCalledTimes(3);
    const writtenPaths = writeFileSpy.mock.calls.map((call) => call[0]).sort();
    expect(writtenPaths).toEqual([
      '/dist/skill/SKILL.md',
      '/dist/skill/components/my-button.md',
      '/dist/skill/components/my-input.md',
    ]);
  });

  it('includes rendered project-level usage content in SKILL.md when present', async () => {
    const docsData = createMockDocsData({
      components: [createMockComponent({ tag: 'my-button' })],
      usage: { installation: 'Install the library with npm install my-design-system.' },
    });
    const outputTargets: d.OutputTargetDocsAgentSkill[] = [
      { type: 'docs-agent-skill', dir: '/dist/skill', name: 'my-design-system' },
    ];

    await generateAgentSkillDocs(compilerCtx, docsData, outputTargets);

    const skillMdCall = writeFileSpy.mock.calls.find((call) => call[0] === '/dist/skill/SKILL.md');
    expect(skillMdCall![1]).toContain('## Usage');
    expect(skillMdCall![1]).toContain('Install the library with npm install my-design-system.');
  });

  it('writes to multiple configured output targets independently', async () => {
    const docsData = createMockDocsData({
      components: [createMockComponent({ tag: 'my-button' })],
    });
    const outputTargets: d.OutputTargetDocsAgentSkill[] = [
      { type: 'docs-agent-skill', dir: '/dist/skill-a', name: 'skill-a' },
      { type: 'docs-agent-skill', dir: '/dist/skill-b', name: 'skill-b' },
    ];

    await generateAgentSkillDocs(compilerCtx, docsData, outputTargets);

    expect(writeFileSpy).toHaveBeenCalledTimes(4);
    const writtenPaths = writeFileSpy.mock.calls.map((call) => call[0]).sort();
    expect(writtenPaths).toEqual([
      '/dist/skill-a/SKILL.md',
      '/dist/skill-a/components/my-button.md',
      '/dist/skill-b/SKILL.md',
      '/dist/skill-b/components/my-button.md',
    ]);
  });
});
