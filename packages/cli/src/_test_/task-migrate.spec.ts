import { mockCompilerSystem, mockValidatedConfig } from '@stencil/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type * as d from '@stencil/core/compiler';

import { createConfigFlags } from '../config-flags';
import { detectMigrations, taskMigrate } from '../task-migrate';

// Mock migration rules module
const mockRules = vi.hoisted(() => [
  {
    id: 'test-rule',
    name: 'Test Migration Rule',
    description: 'A test migration rule',
    fromVersion: '4.x',
    toVersion: '5.x',
    detect: vi.fn(),
    transform: vi.fn(),
  },
]);

vi.mock('../migrations', () => ({
  getRulesForVersionUpgrade: vi.fn((from: string, to: string) => {
    if (from === '4' && to === '5') {
      return mockRules;
    }
    return [];
  }),
}));

// Mock TypeScript's getParsedCommandLineOfConfigFile
vi.mock('typescript', async () => {
  const actual = await vi.importActual<typeof import('typescript')>('typescript');
  return {
    ...actual,
    default: {
      ...actual,
      getParsedCommandLineOfConfigFile: vi.fn(() => ({
        fileNames: ['/test/src/components/my-component.tsx'],
        errors: [],
      })),
    },
  };
});

const mockCoreCompiler = {
  version: '5.0.0',
} as any;

interface SetupOptions {
  dryRun?: boolean;
  fileContent?: string | null;
  detectMatches?: Array<{ node: any; message: string; line: number; column: number }>;
}

const setup = async (options: SetupOptions = {}) => {
  const { dryRun = false, fileContent = null, detectMatches = [] } = options;

  const sys = mockCompilerSystem();
  const flags = createConfigFlags({ task: 'migrate', dryRun });
  const config: d.ValidatedConfig = mockValidatedConfig({
    configPath: '/test/stencil.config.ts',
    rootDir: '/test',
    sys,
  });

  // Mock sys methods
  config.sys.exit = vi.fn();
  vi.spyOn(config.sys, 'readFile').mockImplementation(async (path: string) => {
    if (path.endsWith('tsconfig.json')) {
      return '{}';
    }
    return fileContent;
  });
  vi.spyOn(config.sys, 'writeFile').mockResolvedValue({} as any);

  // Mock logger methods
  const infoSpy = vi.spyOn(config.logger, 'info');

  // Configure mock rule behavior
  mockRules[0].detect.mockReturnValue(detectMatches);
  mockRules[0].transform.mockImplementation((_sourceFile: any, _matches: any) => {
    return 'transformed content';
  });

  return { config, flags, infoSpy, sys };
};

describe('task-migrate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when no migrations are needed', () => {
    it('should report that code is up to date', async () => {
      const { config, flags, infoSpy } = await setup({
        fileContent: 'const x = 1;',
        detectMatches: [],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('No migrations needed'));
    });

    it('should not write any files', async () => {
      const { config, flags, sys } = await setup({
        fileContent: 'const x = 1;',
        detectMatches: [],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      // writeFile should not be called for component files
      const writeFileCalls = (sys.writeFile as any).mock.calls.filter((call: any[]) =>
        call[0].endsWith('.tsx'),
      );
      expect(writeFileCalls).toHaveLength(0);
    });
  });

  describe('when migrations are found', () => {
    const migrationMatch = {
      node: {},
      message: 'Found deprecated API',
      line: 10,
      column: 5,
    };

    it('should show detected migrations', async () => {
      const { config, flags, infoSpy } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Line 10'));
    });

    it('should apply migrations and write files', async () => {
      const { config, flags, sys } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(sys.writeFile).toHaveBeenCalledWith(
        '/test/src/components/my-component.tsx',
        'transformed content',
      );
    });

    it('should show success message', async () => {
      const { config, flags, infoSpy } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully migrated'));
    });

    it('should show migration summary', async () => {
      const { config, flags, infoSpy } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Migration Summary'));
    });
  });

  describe('with --dry-run flag', () => {
    const migrationMatch = {
      node: {},
      message: 'Found deprecated API',
      line: 10,
      column: 5,
    };

    it('should not modify files', async () => {
      const { config, flags, sys } = await setup({
        dryRun: true,
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      // writeFile should not be called for component files
      const writeFileCalls = (sys.writeFile as any).mock.calls.filter((call: any[]) =>
        call[0].endsWith('.tsx'),
      );
      expect(writeFileCalls).toHaveLength(0);
    });

    it('should show dry run message', async () => {
      const { config, flags, infoSpy } = await setup({
        dryRun: true,
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run mode'));
    });

    it('should show hint to run without --dry-run', async () => {
      const { config, flags, infoSpy } = await setup({
        dryRun: true,
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run without --dry-run to apply the migrations'),
      );
    });

    it('should still show what would be migrated', async () => {
      const { config, flags, infoSpy } = await setup({
        dryRun: true,
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Line 10'));
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Found deprecated API'));
    });
  });

  describe('edge cases', () => {
    it('should handle no TypeScript files found', async () => {
      const ts = await import('typescript');
      // Use mockReturnValueOnce to avoid affecting other tests
      vi.mocked(ts.default.getParsedCommandLineOfConfigFile).mockReturnValueOnce({
        fileNames: [],
        errors: [],
        options: {},
      } as any);

      const { config, flags, infoSpy } = await setup({
        fileContent: null,
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('No TypeScript files found'));
    });

    it('should handle empty file content', async () => {
      const { config, flags, sys } = await setup({
        fileContent: null,
        detectMatches: [],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      // Should not crash and should not write any files
      const writeFileCalls = (sys.writeFile as any).mock.calls.filter((call: any[]) =>
        call[0].endsWith('.tsx'),
      );
      expect(writeFileCalls).toHaveLength(0);
    });
  });

  describe('detectMigrations', () => {
    it('should return hasMigrations: false when no migrations found', async () => {
      const { config } = await setup({
        fileContent: 'const x = 1;',
        detectMatches: [],
      });

      const result = await detectMigrations(mockCoreCompiler, config);

      expect(result.hasMigrations).toBe(false);
      expect(result.totalMatches).toBe(0);
      expect(result.filesAffected).toBe(0);
      expect(result.migrations).toHaveLength(0);
    });

    it('should return hasMigrations: true when migrations are found', async () => {
      const migrationMatch = {
        node: {},
        message: 'Found deprecated API',
        line: 10,
        column: 5,
      };

      const { config } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      const result = await detectMigrations(mockCoreCompiler, config);

      expect(result.hasMigrations).toBe(true);
      expect(result.totalMatches).toBe(1);
      expect(result.filesAffected).toBe(1);
      expect(result.migrations).toHaveLength(1);
    });

    it('should include migration details', async () => {
      const migrationMatch = {
        node: {},
        message: 'Found deprecated API',
        line: 10,
        column: 5,
      };

      const { config } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      const result = await detectMigrations(mockCoreCompiler, config);

      expect(result.migrations[0].filePath).toBe('/test/src/components/my-component.tsx');
      expect(result.migrations[0].rule.id).toBe('test-rule');
      expect(result.migrations[0].matches).toHaveLength(1);
    });

    it('should not modify any files', async () => {
      const migrationMatch = {
        node: {},
        message: 'Found deprecated API',
        line: 10,
        column: 5,
      };

      const { config, sys } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await detectMigrations(mockCoreCompiler, config);

      // writeFile should never be called during detection
      expect(sys.writeFile).not.toHaveBeenCalled();
    });

    it('should include rules in result', async () => {
      const { config } = await setup({
        fileContent: 'const x = 1;',
        detectMatches: [],
      });

      const result = await detectMigrations(mockCoreCompiler, config);

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].id).toBe('test-rule');
    });
  });
});
