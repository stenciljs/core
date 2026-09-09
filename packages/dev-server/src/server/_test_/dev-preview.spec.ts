import { mockComponentMeta } from '@stencil/core/testing';
import { describe, expect, it } from 'vitest';

import { generateDevPreview } from '../dev-preview';
import type { CompilerBuildResults } from '../types';

const mockBuildResults = (components: CompilerBuildResults['components']): CompilerBuildResults =>
  ({
    buildId: 0,
    components,
    diagnostics: [],
    dirsAdded: [],
    dirsDeleted: [],
    duration: 0,
    filesAdded: [],
    filesChanged: [],
    filesDeleted: [],
    filesUpdated: [],
    hasError: false,
    hasSuccessfulBuild: true,
    isRebuild: false,
    namespace: 'TestApp',
    fsNamespace: 'testapp',
    outputs: [],
    rootDir: '/',
    srcDir: '/src',
    timestamp: '',
  }) as unknown as CompilerBuildResults;

describe('generateDevPreview', () => {
  it('renders the component jsdoc description', () => {
    const component = mockComponentMeta({
      tagName: 'my-cmp',
      docs: { text: 'A description of my component.', tags: [] },
    });

    const html = generateDevPreview(mockBuildResults([component]));

    expect(html).toContain('A description of my component.');
  });

  it('omits the description block when there is no jsdoc text', () => {
    const component = mockComponentMeta({
      tagName: 'my-cmp',
      docs: { text: '', tags: [] },
    });

    const html = generateDevPreview(mockBuildResults([component]));

    expect(html).not.toContain('<p class="component-description">');
  });

  it('shows a note pointing to usage/*.md when no custom snippets are found', () => {
    const component = mockComponentMeta({ tagName: 'my-cmp' });

    const html = generateDevPreview(mockBuildResults([component]));

    expect(html).toContain('usage/*.md');
    expect(html).toContain('<my-cmp></my-cmp>');
  });
});
