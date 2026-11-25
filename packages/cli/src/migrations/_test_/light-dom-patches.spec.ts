import ts from 'typescript';
import { describe, it, expect } from 'vitest';

import { lightDomPatchesRule } from '../rules/light-dom-patches';

const parse = (source: string) =>
  ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);

const migrate = (source: string) => {
  const sourceFile = parse(source);
  return lightDomPatchesRule.transform(sourceFile, lightDomPatchesRule.detect(sourceFile));
};

const syntaxErrors = (source: string) =>
  ts.transpileModule(source, { reportDiagnostics: true }).diagnostics;

describe('light-dom-patches migration', () => {
  it('replaces a slot fix flag that is last, without a trailing comma', () => {
    const result = migrate(`export const config: Config = {
  extras: { enableImportInjection: true, slotChildNodesFix: true },
};`);
    expect(result).toBe(`export const config: Config = {
  extras: { enableImportInjection: true, lightDomPatches: { childNodes: true } },
};`);
  });

  it('replaces a slot fix flag that is followed by another option', () => {
    const result = migrate(`export const config: Config = {
  extras: {
    experimentalSlotFixes: false,
    initializeNextTick: false,
  },
};`);
    expect(result).toBe(`export const config: Config = {
  extras: {
    lightDomPatches: false,
    initializeNextTick: false,
  },
};`);
  });

  it('combines several slot fix flags', () => {
    const result = migrate(`export const config: Config = {
  extras: { appendChildSlotFix: true, initializeNextTick: false, cloneNodeFix: false },
};`);
    expect(syntaxErrors(result)).toEqual([]);
    expect(result).toContain('lightDomPatches: { domMutations: true, cloneNode: false }');
    expect(result).toContain('initializeNextTick: false');
    expect(result).not.toContain('appendChildSlotFix');
    expect(result).not.toContain('cloneNodeFix');
  });

  it('removes extras when it becomes empty and keeps the config valid', () => {
    const result = migrate(`export const config: Config = {
  namespace: 'app',
  extras: { experimentalSlotFixes: true },
  taskQueue: 'async',
};`);
    expect(result).toBe(`export const config: Config = {
  namespace: 'app',
  taskQueue: 'async',
};`);
  });
});
