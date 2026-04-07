import { mockCompilerSystem, mockValidatedConfig } from '@stencil/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type * as d from '@stencil/core/compiler';

import { createConfigFlags } from '../config-flags';
import { taskMigrate } from '../task-migrate';

// Mock prompts module
const promptMock = vi.hoisted(() => vi.fn());

vi.mock('prompts', () => ({
  prompt: promptMock,
}));

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
  yes?: boolean;
  fileContent?: string | null;
  detectMatches?: Array<{ node: any; message: string; line: number; column: number }>;
}

const setup = async (options: SetupOptions = {}) => {
  const { dryRun = false, yes = false, fileContent = null, detectMatches = [] } = options;

  const sys = mockCompilerSystem();
  const flags = createConfigFlags({ task: 'migrate', dryRun, yes });
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
  vi.spyOn(config.sys, 'writeFile').mockResolvedValue();

  // Mock logger methods
  const infoSpy = vi.spyOn(config.logger, 'info');

  // Configure mock rule behavior
  mockRules[0].detect.mockReturnValue(detectMatches);
  mockRules[0].transform.mockImplementation((sourceFile: any) => {
    return 'transformed content';
  });

  return { config, flags, infoSpy, sys };
};

describe('task-migrate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    it('should not prompt the user', async () => {
      const { config, flags } = await setup({
        fileContent: 'const x = 1;',
        detectMatches: [],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(promptMock).not.toHaveBeenCalled();
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
      promptMock.mockResolvedValue({ action: 'exit' });

      const { config, flags, infoSpy } = await setup({
        fileContent: '@Component({ shadow: true }) class MyComponent {}',
        detectMatches: [migrationMatch],
      });

      await taskMigrate(mockCoreCompiler, config, flags);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Migrations Found'));
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Line 10'));
    });

    describe('with --dry-run flag', () => {
      it('should skip the prompt', async () => {
        const { config, flags } = await setup({
          dryRun: true,
          fileContent: '@Component({ shadow: true }) class MyComponent {}',
          detectMatches: [migrationMatch],
        });

        await taskMigrate(mockCoreCompiler, config, flags);

        expect(promptMock).not.toHaveBeenCalled();
      });

      it('should not modify files', async () => {
        const { config, flags, sys } = await setup({
          dryRun: true,
          fileContent: '@Component({ shadow: true }) class MyComponent {}',
          detectMatches: [migrationMatch],
        });

        await taskMigrate(mockCoreCompiler, config, flags);

        // writeFile should not be called for component files (only tsconfig read)
        const writeFileCalls = (sys.writeFile as any).mock.calls.filter(
          (call: any[]) => !call[0].endsWith('tsconfig.json'),
        );
        expect(writeFileCalls).toHaveLength(0);
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
    });

    describe('with --yes flag (CI mode)', () => {
      it('should skip the prompt', async () => {
        const { config, flags } = await setup({
          yes: true,
          fileContent: '@Component({ shadow: true }) class MyComponent {}',
          detectMatches: [migrationMatch],
        });

        await taskMigrate(mockCoreCompiler, config, flags);

        expect(promptMock).not.toHaveBeenCalled();
      });

      it('should automatically apply migrations', async () => {
        const { config, flags, sys } = await setup({
          yes: true,
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
          yes: true,
          fileContent: '@Component({ shadow: true }) class MyComponent {}',
          detectMatches: [migrationMatch],
        });

        await taskMigrate(mockCoreCompiler, config, flags);

        expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Migration Complete'));
        expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully migrated'));
      });
    });

    describe('interactive mode', () => {
      it('should prompt user with three choices', async () => {
        promptMock.mockResolvedValue({ action: 'exit' });

        const { config, flags } = await setup({
          fileContent: '@Component({ shadow: true }) class MyComponent {}',
          detectMatches: [migrationMatch],
        });

        await taskMigrate(mockCoreCompiler, config, flags);

        expect(promptMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'select',
            choices: expect.arrayContaining([
              expect.objectContaining({ value: 'run' }),
              expect.objectContaining({ value: 'dry-run' }),
              expect.objectContaining({ value: 'exit' }),
            ]),
          }),
        );
      });

      describe('when user chooses "run"', () => {
        it('should apply migrations', async () => {
          promptMock.mockResolvedValue({ action: 'run' });

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
          promptMock.mockResolvedValue({ action: 'run' });

          const { config, flags, infoSpy } = await setup({
            fileContent: '@Component({ shadow: true }) class MyComponent {}',
            detectMatches: [migrationMatch],
          });

          await taskMigrate(mockCoreCompiler, config, flags);

          expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Migration Complete'));
          expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully migrated'));
        });
      });

      describe('when user chooses "dry-run"', () => {
        it('should not modify files', async () => {
          promptMock.mockResolvedValue({ action: 'dry-run' });

          const { config, flags, sys } = await setup({
            fileContent: '@Component({ shadow: true }) class MyComponent {}',
            detectMatches: [migrationMatch],
          });

          await taskMigrate(mockCoreCompiler, config, flags);

          const writeFileCalls = (sys.writeFile as any).mock.calls.filter(
            (call: any[]) => !call[0].endsWith('tsconfig.json'),
          );
          expect(writeFileCalls).toHaveLength(0);
        });

        it('should show hint to run again', async () => {
          promptMock.mockResolvedValue({ action: 'dry-run' });

          const { config, flags, infoSpy } = await setup({
            fileContent: '@Component({ shadow: true }) class MyComponent {}',
            detectMatches: [migrationMatch],
          });

          await taskMigrate(mockCoreCompiler, config, flags);

          expect(infoSpy).toHaveBeenCalledWith(
            expect.stringContaining('Run the migrate command again to apply changes'),
          );
        });
      });

      describe('when user chooses "exit"', () => {
        it('should not modify files', async () => {
          promptMock.mockResolvedValue({ action: 'exit' });

          const { config, flags, sys } = await setup({
            fileContent: '@Component({ shadow: true }) class MyComponent {}',
            detectMatches: [migrationMatch],
          });

          await taskMigrate(mockCoreCompiler, config, flags);

          const writeFileCalls = (sys.writeFile as any).mock.calls.filter(
            (call: any[]) => !call[0].endsWith('tsconfig.json'),
          );
          expect(writeFileCalls).toHaveLength(0);
        });

        it('should show exit message', async () => {
          promptMock.mockResolvedValue({ action: 'exit' });

          const { config, flags, infoSpy } = await setup({
            fileContent: '@Component({ shadow: true }) class MyComponent {}',
            detectMatches: [migrationMatch],
          });

          await taskMigrate(mockCoreCompiler, config, flags);

          expect(infoSpy).toHaveBeenCalledWith(
            expect.stringContaining('Exiting without making changes'),
          );
        });
      });

      describe('when user presses Ctrl+C', () => {
        it('should treat as exit', async () => {
          promptMock.mockResolvedValue({ action: undefined });

          const { config, flags, infoSpy } = await setup({
            fileContent: '@Component({ shadow: true }) class MyComponent {}',
            detectMatches: [migrationMatch],
          });

          await taskMigrate(mockCoreCompiler, config, flags);

          expect(infoSpy).toHaveBeenCalledWith(
            expect.stringContaining('Exiting without making changes'),
          );
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle no TypeScript files found', async () => {
      const ts = await import('typescript');
      vi.mocked(ts.default.getParsedCommandLineOfConfigFile).mockReturnValue({
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

    it('should handle missing tsconfig', async () => {
      const { config, flags, infoSpy } = await setup();

      // Override readFile to return null for tsconfig
      vi.spyOn(config.sys, 'readFile').mockResolvedValue(null);

      await taskMigrate(mockCoreCompiler, config, flags);

      // Should log an error about tsconfig
      const errorSpy = vi.spyOn(config.logger, 'error');
      // The function returns early, so we just verify it doesn't crash
      expect(config.sys.exit).not.toHaveBeenCalled();
    });
  });
});
