import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
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
    const o = config.outputTargets.find(
      (o) => o.type === 'docs-readme',
    ) as d.OutputTargetDocsReadme;
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

  it('does not auto-add docs-readme for a production build without one declared', () => {
    userConfig = mockConfig({ devMode: false });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === 'docs-readme')).toBe(false);
  });

  it('does not auto-add docs-readme when the --docs flag is used without one declared', () => {
    userConfig = mockConfig({ _docsFlag: true });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === 'docs-readme')).toBe(false);
  });

  it('should use default values for docs.markdown.targetComponent', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.docs.markdown.targetComponent.background).toBe(
      DEFAULT_TARGET_COMPONENT_STYLES.background,
    );
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
    expect(config.docs.markdown.targetComponent.background).toBe(
      userConfig.docs.markdown.targetComponent.background,
    );
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
    expect(config.docs.markdown.targetComponent.textColor).toBe(
      userConfig.docs.markdown.targetComponent.textColor,
    );
  });

  describe('docs-agent-skill', () => {
    it('defaults dir to dist/skill', () => {
      userConfig.outputTargets = [{ type: 'docs-agent-skill' } as d.OutputTargetDocsAgentSkill];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(
        (o) => o.type === 'docs-agent-skill',
      ) as d.OutputTargetDocsAgentSkill;
      expect(o.dir).toContain('dist/skill');
    });

    it('honors an explicit dir and makes it absolute', () => {
      userConfig.outputTargets = [
        { type: 'docs-agent-skill', dir: 'my-skill-dir' } as d.OutputTargetDocsAgentSkill,
      ];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(
        (o) => o.type === 'docs-agent-skill',
      ) as d.OutputTargetDocsAgentSkill;
      expect(o.dir).toContain('my-skill-dir');
    });

    it('defaults name to a kebab-cased namespace', () => {
      userConfig.namespace = 'My Design System';
      userConfig.outputTargets = [{ type: 'docs-agent-skill' } as d.OutputTargetDocsAgentSkill];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(
        (o) => o.type === 'docs-agent-skill',
      ) as d.OutputTargetDocsAgentSkill;
      expect(o.name).toBe('my-design-system');
    });

    it('honors an explicit name (still sanitized)', () => {
      userConfig.outputTargets = [
        { type: 'docs-agent-skill', name: 'Custom Name' } as d.OutputTargetDocsAgentSkill,
      ];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(
        (o) => o.type === 'docs-agent-skill',
      ) as d.OutputTargetDocsAgentSkill;
      expect(o.name).toBe('custom-name');
    });

    it('skips in dev by default, unless the --docs flag was used', () => {
      userConfig.outputTargets = [{ type: 'docs-agent-skill' } as d.OutputTargetDocsAgentSkill];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const o = config.outputTargets.find(
        (o) => o.type === 'docs-agent-skill',
      ) as d.OutputTargetDocsAgentSkill;
      expect(o.skipInDev).toBe(!config._docsFlag);
    });
  });
});
