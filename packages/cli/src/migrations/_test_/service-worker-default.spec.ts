import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { serviceWorkerDefaultRule } from '../rules/service-worker-default';

function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('stencil.config.ts', code, ts.ScriptTarget.Latest, true);
}

function transform(code: string): string {
  const sf = createSourceFile(code);
  const matches = serviceWorkerDefaultRule.detect(sf);
  return serviceWorkerDefaultRule.transform(sf, matches);
}

describe('serviceWorkerDefaultRule', () => {
  describe('detect', () => {
    it('detects serviceWorker: null on www output target', () => {
      const sf = createSourceFile(
        `export const config = { outputTargets: [{ type: 'www', serviceWorker: null }] };`,
      );
      expect(serviceWorkerDefaultRule.detect(sf)).toHaveLength(1);
    });

    it('detects serviceWorker: false on www output target', () => {
      const sf = createSourceFile(
        `export const config = { outputTargets: [{ type: 'www', serviceWorker: false }] };`,
      );
      expect(serviceWorkerDefaultRule.detect(sf)).toHaveLength(1);
    });

    it('does not detect serviceWorker: null on non-www output target', () => {
      const sf = createSourceFile(
        `export const config = { outputTargets: [{ type: 'dist', serviceWorker: null }] };`,
      );
      expect(serviceWorkerDefaultRule.detect(sf)).toHaveLength(0);
    });

    it('does not detect serviceWorker with a config object', () => {
      const sf = createSourceFile(
        `export const config = { outputTargets: [{ type: 'www', serviceWorker: {} }] };`,
      );
      expect(serviceWorkerDefaultRule.detect(sf)).toHaveLength(0);
    });

    it('does not detect when serviceWorker is absent', () => {
      const sf = createSourceFile(`export const config = { outputTargets: [{ type: 'www' }] };`);
      expect(serviceWorkerDefaultRule.detect(sf)).toHaveLength(0);
    });
  });

  describe('transform', () => {
    it('removes serviceWorker: null with trailing comma', () => {
      expect(
        transform(
          `export const config = { outputTargets: [{ type: 'www', serviceWorker: null, dir: 'www' }] };`,
        ),
      ).toBe(`export const config = { outputTargets: [{ type: 'www', dir: 'www' }] };`);
    });

    it('removes serviceWorker: false with trailing comma', () => {
      expect(
        transform(
          `export const config = { outputTargets: [{ type: 'www', serviceWorker: false, dir: 'www' }] };`,
        ),
      ).toBe(`export const config = { outputTargets: [{ type: 'www', dir: 'www' }] };`);
    });

    it('removes serviceWorker: null as last property', () => {
      expect(
        transform(
          `export const config = { outputTargets: [{ type: 'www', serviceWorker: null }] };`,
        ),
      ).toBe(`export const config = { outputTargets: [{ type: 'www' }] };`);
    });

    it('removes serviceWorker: null in multiline config', () => {
      const input = `export const config: Config = {
  outputTargets: [
    {
      type: 'www',
      dir: 'www',
      serviceWorker: null,
    },
  ],
};`;
      const expected = `export const config: Config = {
  outputTargets: [
    {
      type: 'www',
      dir: 'www',
    },
  ],
};`;
      expect(transform(input)).toBe(expected);
    });

    it('leaves non-www targets untouched', () => {
      const input = `export const config = { outputTargets: [{ type: 'dist', serviceWorker: null }] };`;
      expect(transform(input)).toBe(input);
    });

    it('leaves serviceWorker config objects untouched', () => {
      const input = `export const config = { outputTargets: [{ type: 'www', serviceWorker: { swDest: 'sw.js' } }] };`;
      expect(transform(input)).toBe(input);
    });
  });
});
