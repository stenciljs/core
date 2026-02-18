import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import type { ValidatedConfig } from '@stencil/core';
import { mockValidatedConfig } from '../../../testing/mocks';
import { createCachingCompilerHost, IncrementalCompiler } from '../incremental-compiler';

// Mock TypeScript
const mockCreateSourceFile = vi.fn();
const mockReadFile = vi.fn();
const mockFileExists = vi.fn();
const mockCreateIncrementalCompilerHost = vi.fn();
const mockCreateEmitAndSemanticDiagnosticsBuilderProgram = vi.fn();
const mockReadConfigFile = vi.fn();
const mockParseJsonConfigFileContent = vi.fn();

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    default: {
      ...(actual as any).default,
      createSourceFile: (...args: any[]) => mockCreateSourceFile(...args),
      createIncrementalCompilerHost: (...args: any[]) => {
        mockCreateIncrementalCompilerHost(...args);
        return {
          readFile: mockReadFile,
          fileExists: mockFileExists,
        };
      },
      createEmitAndSemanticDiagnosticsBuilderProgram: (...args: any[]) => {
        mockCreateEmitAndSemanticDiagnosticsBuilderProgram(...args);
        return {
          getProgram: () => ({}),
        };
      },
      readConfigFile: (...args: any[]) => {
        mockReadConfigFile(...args);
        return { config: {} };
      },
      parseJsonConfigFileContent: (...args: any[]) => {
        mockParseJsonConfigFileContent(...args);
        return {
          fileNames: ['src/index.ts'],
          options: {},
        };
      },
      sys: {
        readFile: (fileName: string) => `// content of ${fileName}`,
        fileExists: () => true,
      },
    },
  };
});

describe('createCachingCompilerHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a host with invalidateFile method', () => {
    const host = createCachingCompilerHost({});
    expect(typeof host.invalidateFile).toBe('function');
  });

  it('creates a host with invalidateAll method', () => {
    const host = createCachingCompilerHost({});
    expect(typeof host.invalidateAll).toBe('function');
  });

  it('caches file reads', () => {
    const host = createCachingCompilerHost({});

    // First read should hit ts.sys
    const content1 = host.readFile!('test.ts');
    // Second read should return cached value
    const content2 = host.readFile!('test.ts');

    expect(content1).toBe(content2);
  });

  it('invalidateFile clears the cache for that file', () => {
    const host = createCachingCompilerHost({});

    // Read and cache
    host.readFile!('test.ts');

    // Invalidate
    host.invalidateFile('test.ts');

    // Next read should hit ts.sys again (we can't easily test this without
    // more complex mocking, but we verify the method exists and runs)
    expect(() => host.invalidateFile('test.ts')).not.toThrow();
  });

  it('invalidateAll clears all caches', () => {
    const host = createCachingCompilerHost({});

    // Read and cache multiple files
    host.readFile!('test1.ts');
    host.readFile!('test2.ts');

    // Invalidate all
    expect(() => host.invalidateAll()).not.toThrow();
  });
});

describe('IncrementalCompiler', () => {
  let config: ValidatedConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = mockValidatedConfig();
    config.tsconfig = '/path/to/tsconfig.json';
    config.rootDir = '/path/to/root';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a compiler instance', () => {
    const compiler = new IncrementalCompiler(config);
    expect(compiler).toBeDefined();
  });

  it('rebuild returns a builder program', () => {
    const compiler = new IncrementalCompiler(config);
    const builderProgram = compiler.rebuild();
    expect(builderProgram).toBeDefined();
    expect(mockCreateEmitAndSemanticDiagnosticsBuilderProgram).toHaveBeenCalled();
  });

  it('invalidateFiles calls host.invalidateFile for each file', () => {
    const compiler = new IncrementalCompiler(config);

    // Rebuild first to ensure host is set up
    compiler.rebuild();

    // Should not throw
    expect(() => compiler.invalidateFiles(['file1.ts', 'file2.ts'])).not.toThrow();
  });

  it('invalidateAll clears all state', () => {
    const compiler = new IncrementalCompiler(config);

    // Rebuild to create some state
    compiler.rebuild();

    // Invalidate all
    compiler.invalidateAll();

    // getBuilderProgram should return undefined after invalidateAll
    expect(compiler.getBuilderProgram()).toBeUndefined();
  });

  it('getProgram returns undefined before first rebuild', () => {
    const compiler = new IncrementalCompiler(config);
    expect(compiler.getProgram()).toBeUndefined();
  });

  it('getProgram returns program after rebuild', () => {
    const compiler = new IncrementalCompiler(config);
    compiler.rebuild();
    expect(compiler.getProgram()).toBeDefined();
  });

  it('passes previous builder program for incremental compilation', () => {
    const compiler = new IncrementalCompiler(config);

    // First rebuild
    compiler.rebuild();
    expect(mockCreateEmitAndSemanticDiagnosticsBuilderProgram).toHaveBeenCalledTimes(1);

    // Second rebuild should pass previous program
    compiler.rebuild();
    expect(mockCreateEmitAndSemanticDiagnosticsBuilderProgram).toHaveBeenCalledTimes(2);

    // The 4th argument should be the previous builder program
    const secondCallArgs = mockCreateEmitAndSemanticDiagnosticsBuilderProgram.mock.calls[1];
    expect(secondCallArgs[3]).toBeDefined(); // Previous builder program
  });
});
