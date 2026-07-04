import { vi, describe, it, expect, beforeEach } from 'vitest';

const fsPromises = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('node:fs/promises', () => fsPromises);

import { openStencilConfig } from '../wizard/config-editor';

const CONFIG_PATH = '/project/stencil.config.ts';

function mockConfig(source: string) {
  fsPromises.readFile.mockResolvedValue(source);
}

function savedText(): string {
  return vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
}

describe('openStencilConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsPromises.writeFile.mockResolvedValue(undefined);
  });

  // ---------------------------------------------------------------------------
  // hasImport / addImport
  // ---------------------------------------------------------------------------

  describe('hasImport', () => {
    it('returns true when the import exists', async () => {
      mockConfig(`import { Config } from '@stencil/core';
import { vueOutputTarget } from '@stencil/vue-output-target';

export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.hasImport('@stencil/vue-output-target')).toBe(true);
    });

    it('returns false when the import does not exist', async () => {
      mockConfig(`import { Config } from '@stencil/core';

export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.hasImport('@stencil/vue-output-target')).toBe(false);
    });
  });

  describe('addImport', () => {
    it('inserts after the last existing import', async () => {
      mockConfig(`import { Config } from '@stencil/core';

export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
      await editor.save();

      const result = savedText();
      expect(result).toContain("import { vueOutputTarget } from '@stencil/vue-output-target';");
      // New import must come after @stencil/core import
      expect(result.indexOf("from '@stencil/vue-output-target'")).toBeGreaterThan(
        result.indexOf("from '@stencil/core'"),
      );
    });

    it('inserts at top when there are no existing imports', async () => {
      mockConfig(`export const config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
      await editor.save();

      const result = savedText();
      expect(result).toContain("import { vueOutputTarget } from '@stencil/vue-output-target';");
    });

    it('supports multiple named imports', async () => {
      mockConfig(`import { Config } from '@stencil/core';

export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addImport('@stencil/sass', ['sass', 'SassOptions']);
      await editor.save();

      expect(savedText()).toContain("import { sass, SassOptions } from '@stencil/sass';");
    });

    it('is a no-op when the module is already imported', async () => {
      const source = `import { Config } from '@stencil/core';
import { vueOutputTarget } from '@stencil/vue-output-target';

export const config: Config = { namespace: 'MyLib' };
`;
      mockConfig(source);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
      await editor.save();

      expect(savedText()).toBe(source);
    });
  });

  // ---------------------------------------------------------------------------
  // outputTargetsContains / addOutputTarget
  // ---------------------------------------------------------------------------

  describe('outputTargetsContains', () => {
    it('returns true when the substring is present', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.outputTargetsContains('loader-bundle')).toBe(true);
    });

    it('returns false when the substring is absent', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.outputTargetsContains('standalone')).toBe(false);
    });

    it('returns false when outputTargets is not present', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.outputTargetsContains('loader-bundle')).toBe(false);
    });
  });

  describe('addOutputTarget', () => {
    it('appends to a multi-line outputTargets array', async () => {
      mockConfig(`import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [
    { type: 'loader-bundle' },
  ],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addOutputTarget("vueOutputTarget({ proxiesFile: 'src/components.ts' })");
      await editor.save();

      const result = savedText();
      expect(result).toContain('loader-bundle');
      expect(result).toContain("vueOutputTarget({ proxiesFile: 'src/components.ts' })");
      // New target must follow existing one
      expect(result.indexOf('vueOutputTarget')).toBeGreaterThan(result.indexOf('loader-bundle'));
    });

    it('appends to an inline outputTargets array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addOutputTarget("{ type: 'standalone' }");
      await editor.save();

      const result = savedText();
      expect(result).toContain('loader-bundle');
      expect(result).toContain('standalone');
    });

    it('appends to an empty outputTargets array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addOutputTarget("{ type: 'loader-bundle' }");
      await editor.save();

      expect(savedText()).toContain('loader-bundle');
    });

    it('creates the outputTargets property when absent', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addOutputTarget("{ type: 'loader-bundle' }");
      await editor.save();

      const result = savedText();
      expect(result).toContain('outputTargets');
      expect(result).toContain('loader-bundle');
    });
  });

  // ---------------------------------------------------------------------------
  // pluginsContains / addPlugin
  // ---------------------------------------------------------------------------

  describe('pluginsContains', () => {
    it('returns true when the substring is present', async () => {
      mockConfig(`import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'MyLib',
  plugins: [sass()],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.pluginsContains('sass(')).toBe(true);
    });

    it('returns false when the substring is absent', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  plugins: [sass()],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.pluginsContains('postcss(')).toBe(false);
    });

    it('returns false when plugins is not present', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.pluginsContains('sass(')).toBe(false);
    });
  });

  describe('addPlugin', () => {
    it('appends to an existing plugins array', async () => {
      mockConfig(`import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'MyLib',
  plugins: [sass()],
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addPlugin('postcss()');
      await editor.save();

      const result = savedText();
      expect(result).toContain('sass()');
      expect(result).toContain('postcss()');
    });

    it('creates the plugins property when absent', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addPlugin('sass()');
      await editor.save();

      const result = savedText();
      expect(result).toContain('plugins');
      expect(result).toContain('sass()');
    });

    it('supports plugin with options', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addPlugin("sass({ injectGlobalPaths: ['src/global/variables.scss'] })");
      await editor.save();

      expect(savedText()).toContain("sass({ injectGlobalPaths: ['src/global/variables.scss'] })");
    });
  });

  // ---------------------------------------------------------------------------
  // Chained edits — verifies re-parse keeps positions correct across mutations
  // ---------------------------------------------------------------------------

  describe('chained edits', () => {
    it('addImport + addOutputTarget writes both correctly', async () => {
      mockConfig(`import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
      editor.addOutputTarget("vueOutputTarget({ proxiesFile: 'src/components.ts' })");
      await editor.save();

      const result = savedText();
      expect(result).toContain("import { vueOutputTarget } from '@stencil/vue-output-target';");
      expect(result).toContain("vueOutputTarget({ proxiesFile: 'src/components.ts' })");
      // Import block must precede the config object
      expect(result.indexOf("from '@stencil/vue-output-target'")).toBeLessThan(
        result.indexOf('outputTargets'),
      );
      // Output target must be inside the outputTargets array, not after it
      expect(result.indexOf('vueOutputTarget(')).toBeGreaterThan(result.indexOf('outputTargets:'));
      expect(result.indexOf('vueOutputTarget(')).toBeLessThan(result.indexOf('};'));
    });

    it('addImport + addPlugin writes both correctly', async () => {
      mockConfig(`import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.addImport('@stencil/sass', ['sass']);
      editor.addPlugin('sass()');
      await editor.save();

      const result = savedText();
      expect(result).toContain("import { sass } from '@stencil/sass';");
      expect(result).toContain('sass()');
      expect(result.indexOf("from '@stencil/sass'")).toBeLessThan(result.indexOf('sass()'));
    });
  });

  // ---------------------------------------------------------------------------
  // replaceOutputTarget / removeOutputTarget
  // ---------------------------------------------------------------------------

  describe('replaceOutputTarget', () => {
    it('replaces a matching element in a multi-line array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [
    { type: 'loader-bundle' },
    vueOutputTarget({ proxiesFile: 'old.ts' }),
  ],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      const replaced = editor.replaceOutputTarget(
        'vueOutputTarget(',
        "vueOutputTarget({ proxiesFile: 'new.ts' })",
      );
      await editor.save();

      expect(replaced).toBe(true);
      const result = savedText();
      expect(result).toContain("proxiesFile: 'new.ts'");
      expect(result).not.toContain("proxiesFile: 'old.ts'");
      expect(result).toContain('loader-bundle');
    });

    it('replaces a matching element in an inline array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }, { type: 'standalone' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.replaceOutputTarget('standalone', "{ type: 'ssr' }");
      await editor.save();

      const result = savedText();
      expect(result).toContain('loader-bundle');
      expect(result).toContain("{ type: 'ssr' }");
      expect(result).not.toContain('standalone');
    });

    it('returns false when no element matches', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.replaceOutputTarget('vueOutputTarget(', 'vueOutputTarget({})')).toBe(false);
    });

    it('returns false when outputTargets is absent', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.replaceOutputTarget('vueOutputTarget(', 'vueOutputTarget({})')).toBe(false);
    });
  });

  describe('removeOutputTarget', () => {
    it('removes a matching element from a multi-line array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [
    { type: 'loader-bundle' },
    vueOutputTarget({ proxiesFile: 'src/components.ts' }),
  ],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      const removed = editor.removeOutputTarget('vueOutputTarget(');
      await editor.save();

      expect(removed).toBe(true);
      const result = savedText();
      expect(result).not.toContain('vueOutputTarget');
      expect(result).toContain('loader-bundle');
    });

    it('removes a matching element from an inline array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }, { type: 'standalone' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.removeOutputTarget('standalone');
      await editor.save();

      const result = savedText();
      expect(result).toContain('loader-bundle');
      expect(result).not.toContain('standalone');
    });

    it('removes the only element leaving an empty array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [
    { type: 'loader-bundle' },
  ],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.removeOutputTarget('loader-bundle');
      await editor.save();

      const result = savedText();
      expect(result).not.toContain('loader-bundle');
      expect(result).toContain('outputTargets');
    });

    it('returns false when no element matches', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  outputTargets: [{ type: 'loader-bundle' }],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.removeOutputTarget('vueOutputTarget(')).toBe(false);
    });

    it('returns false when outputTargets is absent', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.removeOutputTarget('loader-bundle')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // replacePlugin / removePlugin
  // ---------------------------------------------------------------------------

  describe('replacePlugin', () => {
    it('replaces a matching plugin in a multi-line array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  plugins: [
    sass(),
  ],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      const replaced = editor.replacePlugin('sass(', "sass({ injectGlobalPaths: ['vars.scss'] })");
      await editor.save();

      expect(replaced).toBe(true);
      expect(savedText()).toContain("sass({ injectGlobalPaths: ['vars.scss'] })");
      expect(savedText()).not.toContain('sass()');
    });

    it('returns false when no element matches', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  plugins: [sass()],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.replacePlugin('postcss(', 'postcss()')).toBe(false);
    });

    it('returns false when plugins is absent', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.replacePlugin('sass(', 'sass()')).toBe(false);
    });
  });

  describe('removePlugin', () => {
    it('removes a matching plugin from a multi-line array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  plugins: [
    sass(),
    postcss(),
  ],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      const removed = editor.removePlugin('sass(');
      await editor.save();

      expect(removed).toBe(true);
      const result = savedText();
      expect(result).not.toContain('sass()');
      expect(result).toContain('postcss()');
    });

    it('removes a matching plugin from an inline array', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  plugins: [sass(), postcss()],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      editor.removePlugin('postcss(');
      await editor.save();

      const result = savedText();
      expect(result).toContain('sass()');
      expect(result).not.toContain('postcss()');
    });

    it('returns false when no element matches', async () => {
      mockConfig(`export const config: Config = {
  namespace: 'MyLib',
  plugins: [sass()],
};
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.removePlugin('postcss(')).toBe(false);
    });

    it('returns false when plugins is absent', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      expect(editor.removePlugin('sass(')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // save()
  // ---------------------------------------------------------------------------

  describe('save', () => {
    it('writes to the provided config path', async () => {
      mockConfig(`export const config: Config = { namespace: 'MyLib' };
`);
      const editor = await openStencilConfig(CONFIG_PATH);
      await editor.save();

      expect(fsPromises.writeFile).toHaveBeenCalledWith(CONFIG_PATH, expect.any(String), 'utf8');
    });

    it('writes unchanged text when no edits are made', async () => {
      const source = `export const config: Config = { namespace: 'MyLib' };
`;
      mockConfig(source);
      const editor = await openStencilConfig(CONFIG_PATH);
      await editor.save();

      expect(savedText()).toBe(source);
    });
  });
});
