import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { rolldownConfigRule } from '../rules/rolldown-config';

function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('stencil.config.ts', code, ts.ScriptTarget.Latest, true);
}

describe('rolldownConfigRule', () => {
  describe('detect', () => {
    it('should detect rollupConfig', () => {
      const code = `export const config = { rollupConfig: { inputOptions: { external: ['foo'] } } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('rollupConfig');
    });

    it('should detect rolldownConfig with inputOptions wrapper', () => {
      const code = `export const config = { rolldownConfig: { inputOptions: { treeshake: false } } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('inputOptions');
    });

    it('should not detect rolldownConfig without inputOptions wrapper', () => {
      const code = `export const config = { rolldownConfig: { external: ['foo'] } };`;
      const sf = createSourceFile(code);
      expect(rolldownConfigRule.detect(sf)).toHaveLength(0);
    });

    it('should detect rollupPlugins', () => {
      const code = `export const config = { rollupPlugins: { before: [] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('rollupPlugins');
    });

    it('should detect nodeResolve.exportConditions rename', () => {
      const code = `export const config = { nodeResolve: { exportConditions: ['browser'] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('conditionNames');
    });

    it('should detect nodeResolve.moduleDirectories rename', () => {
      const code = `export const config = { nodeResolve: { moduleDirectories: ['node_modules'] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('modules');
    });

    it('should detect unsupported nodeResolve fields', () => {
      const code = `export const config = { nodeResolve: { browser: true, jail: '/src', dedupe: ['react'] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(3);
      expect(matches.every((m) => m.message.includes('not supported'))).toBe(true);
    });

    it('should not detect supported nodeResolve fields', () => {
      const code = `export const config = { nodeResolve: { extensions: ['.ts'], mainFields: ['module'] } };`;
      const sf = createSourceFile(code);
      expect(rolldownConfigRule.detect(sf)).toHaveLength(0);
    });

    it('should not detect exportConditions outside nodeResolve', () => {
      const code = `export const config = { exportConditions: ['browser'] };`;
      const sf = createSourceFile(code);
      expect(rolldownConfigRule.detect(sf)).toHaveLength(0);
    });
  });

  describe('transform', () => {
    it('should rename rollupPlugins → rolldownPlugins', () => {
      const code = `export const config = { rollupPlugins: { before: [], after: [] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).toContain('rolldownPlugins');
      expect(result).not.toContain('rollupPlugins');
    });

    it('should rename rollupConfig → rolldownConfig and flatten inputOptions', () => {
      const code = `export const config = {
  rollupConfig: {
    inputOptions: {
      external: ['foo'],
      treeshake: false,
    },
  },
};`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).toContain('rolldownConfig');
      expect(result).not.toContain('rollupConfig');
      expect(result).not.toContain('inputOptions');
      expect(result).toContain("external: ['foo']");
      expect(result).toContain('treeshake: false');
    });

    it('should flatten rolldownConfig.inputOptions for v5 beta users', () => {
      const code = `export const config = { rolldownConfig: { inputOptions: { external: ['react'] } } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).toContain('rolldownConfig');
      expect(result).not.toContain('inputOptions');
      expect(result).toContain("external: ['react']");
    });

    it('should drop outputOptions when flattening', () => {
      const code = `export const config = {
  rollupConfig: {
    inputOptions: { external: ['foo'] },
    outputOptions: { globals: { jquery: '$' } },
  },
};`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).not.toContain('outputOptions');
      expect(result).not.toContain('globals');
      expect(result).toContain("external: ['foo']");
    });

    it('should rename nodeResolve.exportConditions → conditionNames', () => {
      const code = `export const config = { nodeResolve: { exportConditions: ['browser'] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).toContain('conditionNames');
      expect(result).not.toContain('exportConditions');
    });

    it('should rename nodeResolve.moduleDirectories → modules', () => {
      const code = `export const config = { nodeResolve: { moduleDirectories: ['node_modules'] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).toContain('modules');
      expect(result).not.toContain('moduleDirectories');
    });

    it('should remove unsupported nodeResolve fields', () => {
      const code = `export const config = { nodeResolve: { browser: true, extensions: ['.ts'] } };`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).not.toContain('browser:');
      expect(result).toContain("extensions: ['.ts']");
    });

    it('should handle multiple changes in one file', () => {
      const code = `export const config = {
  rollupPlugins: { before: [] },
  rollupConfig: { inputOptions: { external: ['react'] } },
  nodeResolve: { exportConditions: ['browser'], browser: true, extensions: ['.ts'] },
};`;
      const sf = createSourceFile(code);
      const matches = rolldownConfigRule.detect(sf);
      expect(matches).toHaveLength(4); // rollupPlugins, rollupConfig, exportConditions, browser
      const result = rolldownConfigRule.transform(sf, matches);
      expect(result).toContain('rolldownPlugins');
      expect(result).toContain('rolldownConfig');
      expect(result).toContain('conditionNames');
      expect(result).toContain("extensions: ['.ts']");
      expect(result).not.toContain('rollupPlugins');
      expect(result).not.toContain('rollupConfig');
      expect(result).not.toContain('inputOptions');
      expect(result).not.toContain('exportConditions');
      expect(result).not.toContain('browser:');
    });
  });
});
