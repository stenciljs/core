import { mockValidatedConfig } from '@stencil/core/testing';

import { getTerserOptions, prepareModule } from '../optimize-module';

describe('optimize-module', () => {
  describe('prepareModule', () => {
    // mirrors the dynamic import in `src/client/client-load-module.ts`, which relies on
    // bundler directive comments being present in the emitted `esm-es5` output
    const loadModuleSource = `export const loadModule = (bundleId, hmrVersionId) => {
  return import(
    /* @vite-ignore */
    /* webpackInclude: /\\.entry\\.js$/ */
    /* webpackExclude: /\\.system\\.entry\\.js$/ */
    /* webpackMode: "lazy" */
    \`./\${bundleId}.entry.js\${hmrVersionId ? '?s-hmr=' + hmrVersionId : ''}\`
  ).then((importedModule) => importedModule);
};`;

    it('preserves bundler directive comments inside dynamic imports when transpiling to es5', async () => {
      const config = mockValidatedConfig({ logLevel: 'info', sourceMap: false });
      const minifyOpts = getTerserOptions(config, 'es5', false);

      const results = await prepareModule(loadModuleSource, minifyOpts, true, true);

      expect(results.diagnostics).toHaveLength(0);
      const importCall = results.output.slice(results.output.indexOf('import('));
      expect(importCall).toContain('/* @vite-ignore */');
      expect(importCall).toContain('webpackInclude:');
      expect(importCall).toContain('webpackExclude:');
      expect(importCall).toContain('webpackMode:');
      // the directive comments must appear before the import specifier argument for
      // bundlers to associate them with the dynamic import
      expect(importCall.indexOf('/* @vite-ignore */')).toBeLessThan(importCall.indexOf('.entry.js'));
    });

    it('still removes regular comments when transpiling to es5', async () => {
      const config = mockValidatedConfig({ logLevel: 'info', sourceMap: false });
      const minifyOpts = getTerserOptions(config, 'es5', false);
      const input = `// a line comment
/* a block comment */
export const add = (a, b) => a + b;`;

      const results = await prepareModule(input, minifyOpts, true, true);

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output).not.toContain('a line comment');
      expect(results.output).not.toContain('a block comment');
    });

    it('preserves license comments when transpiling to es5', async () => {
      const config = mockValidatedConfig({ logLevel: 'info', sourceMap: false });
      const minifyOpts = getTerserOptions(config, 'es5', false);
      const input = `/*! some license */
export const add = (a, b) => a + b;`;

      const results = await prepareModule(input, minifyOpts, true, true);

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output).toContain('/*! some license */');
    });
  });
});
