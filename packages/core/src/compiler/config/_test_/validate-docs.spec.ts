import type * as d from '@stencil/core';
import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_TARGET_COMPONENT_STYLES } from '../constants';
import { validateConfig } from '../validate-config';

describe('validateDocs', () => {
  let userConfig: d.Config;

  beforeEach(() => {
    userConfig = mockConfig();
  });

  it('readme docs dir', () => {
    userConfig.outputTargets = [
      {
        type: 'docs-readme',
        dir: 'my-dir',
      } as d.OutputTargetDocsReadme,
    ];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'docs-readme') as d.OutputTargetDocsReadme;
    expect(o.dir).toContain('my-dir');
  });

  it('default no docs, not remove docs output target', () => {
    userConfig.outputTargets = [{ type: 'docs-readme' }];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === 'docs-readme')).toBe(true);
  });

  it('default no docs, no output target', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === 'docs-readme')).toBe(false);
  });

  it('should use default values for docs.markdown.targetComponent', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.docs.markdown.targetComponent.background).toBe(DEFAULT_TARGET_COMPONENT_STYLES.background);
  });

  it('should use user values for docs.markdown.targetComponent.background', () => {
    userConfig = mockConfig({
      docs: {
        markdown: {
          targetComponent: {
            background: '#123',
          },
        },
      },
    });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.docs.markdown.targetComponent.background).toBe(userConfig.docs.markdown.targetComponent.background);
  });

  it('should use user values for docs.markdown.targetComponent.textColor', () => {
    userConfig = mockConfig({
      docs: {
        markdown: {
          targetComponent: {
            textColor: '#123',
          },
        },
      },
    });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.docs.markdown.targetComponent.textColor).toBe(userConfig.docs.markdown.targetComponent.textColor);
  });
});
