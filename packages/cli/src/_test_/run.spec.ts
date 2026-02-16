import * as coreCompiler from '@stencil/core';
import { mockCompilerSystem, mockConfig, mockLogger as createMockLogger } from '@stencil/core/testing';
import { vi, type MockInstance, describe, it, beforeEach, expect, afterEach } from 'vitest';

import type * as d from '@stencil/core';
import { createTestingSystem } from '@stencil/core/testing';
import { createConfigFlags } from '../config-flags';
import * as ParseFlags from '../parse-flags';
import { run, runTask } from '../run';
import * as BuildTask from '../task-build';
import * as DocsTask from '../task-docs';
import * as GenerateTask from '../task-generate';
import * as HelpTask from '../task-help';
import * as PrerenderTask from '../task-prerender';
import * as ServeTask from '../task-serve';
import * as TelemetryTask from '../task-telemetry';

describe('run', () => {
  describe('run()', () => {
    let cliInitOptions: d.CliInitOptions;
    let mockLogger: d.Logger;
    let mockSystem: d.CompilerSystem;

    let parseFlagsSpy: MockInstance<typeof ParseFlags.parseFlags>;

    beforeEach(() => {
      mockLogger = createMockLogger();
      mockSystem = createTestingSystem();

      cliInitOptions = {
        args: [],
        logger: mockLogger,
        sys: mockSystem,
      };

      parseFlagsSpy = vi.spyOn(ParseFlags, 'parseFlags');
      parseFlagsSpy.mockReturnValue(
        createConfigFlags({
          // use the 'help' task as a reasonable default for all calls to this function.
          // code paths that require a different task can always override this value as needed.
          task: 'help',
        }),
      );
    });

    afterEach(() => {
      parseFlagsSpy.mockRestore();
    });

    describe('help task', () => {
      let taskHelpSpy: MockInstance<typeof HelpTask.taskHelp>;

      beforeEach(() => {
        taskHelpSpy = vi.spyOn(HelpTask, 'taskHelp');
        taskHelpSpy.mockReturnValue(Promise.resolve());
      });

      afterEach(() => {
        taskHelpSpy.mockRestore();
      });

      it("calls the help task when the 'task' field is set to 'help'", async () => {
        await run(cliInitOptions);

        expect(taskHelpSpy).toHaveBeenCalledTimes(1);
        expect(taskHelpSpy).toHaveBeenCalledWith(
          {
            task: 'help',
            args: [],
            knownArgs: [],
            unknownArgs: [],
          },
          mockLogger,
          mockSystem,
        );

        taskHelpSpy.mockRestore();
      });

      it("calls the help task when the 'task' field is set to null", async () => {
        parseFlagsSpy.mockReturnValue(
          createConfigFlags({
            task: null,
          }),
        );

        await run(cliInitOptions);

        expect(taskHelpSpy).toHaveBeenCalledTimes(1);
        expect(taskHelpSpy).toHaveBeenCalledWith(
          {
            task: 'help',
            args: [],
            knownArgs: [],
            unknownArgs: [],
          },
          mockLogger,
          mockSystem,
        );

        taskHelpSpy.mockRestore();
      });

      it("calls the help task when the 'help' field is set on flags", async () => {
        parseFlagsSpy.mockReturnValue(
          createConfigFlags({
            help: true,
          }),
        );

        await run(cliInitOptions);

        expect(taskHelpSpy).toHaveBeenCalledTimes(1);
        expect(taskHelpSpy).toHaveBeenCalledWith(
          {
            task: 'help',
            args: [],
            unknownArgs: [],
            knownArgs: [],
          },
          mockLogger,
          mockSystem,
        );

        taskHelpSpy.mockRestore();
      });
    });
  });

  describe('runTask()', () => {
    let sys: d.CompilerSystem;
    let unvalidatedConfig: d.UnvalidatedConfig;

    let taskBuildSpy: MockInstance<typeof BuildTask.taskBuild>;
    let taskDocsSpy: MockInstance<typeof DocsTask.taskDocs>;
    let taskGenerateSpy: MockInstance<typeof GenerateTask.taskGenerate>;
    let taskHelpSpy: MockInstance<typeof HelpTask.taskHelp>;
    let taskPrerenderSpy: MockInstance<typeof PrerenderTask.taskPrerender>;
    let taskServeSpy: MockInstance<typeof ServeTask.taskServe>;
    let taskTelemetrySpy: MockInstance<typeof TelemetryTask.taskTelemetry>;

    beforeEach(() => {
      sys = mockCompilerSystem();
      sys.exit = vi.fn();

      unvalidatedConfig = mockConfig({ outputTargets: [], sys, fsNamespace: 'testing' });

      taskBuildSpy = vi.spyOn(BuildTask, 'taskBuild');
      taskBuildSpy.mockResolvedValue();

      taskDocsSpy = vi.spyOn(DocsTask, 'taskDocs');
      taskDocsSpy.mockResolvedValue();

      taskGenerateSpy = vi.spyOn(GenerateTask, 'taskGenerate');
      taskGenerateSpy.mockResolvedValue();

      taskHelpSpy = vi.spyOn(HelpTask, 'taskHelp');
      taskHelpSpy.mockResolvedValue();

      taskPrerenderSpy = vi.spyOn(PrerenderTask, 'taskPrerender');
      taskPrerenderSpy.mockResolvedValue();

      taskServeSpy = vi.spyOn(ServeTask, 'taskServe');
      taskServeSpy.mockResolvedValue();

      taskTelemetrySpy = vi.spyOn(TelemetryTask, 'taskTelemetry');
      taskTelemetrySpy.mockResolvedValue();
    });

    afterEach(() => {
      taskBuildSpy.mockRestore();
      taskDocsSpy.mockRestore();
      taskGenerateSpy.mockRestore();
      taskHelpSpy.mockRestore();
      taskPrerenderSpy.mockRestore();
      taskServeSpy.mockRestore();
      taskTelemetrySpy.mockRestore();
    });

    describe('default configuration', () => {
      describe('sys property', () => {
        it('uses the sys argument if one is provided', async () => {
          // remove the `CompilerSystem` on the config, just to be sure we don't accidentally use it
          unvalidatedConfig.sys = undefined;

          await runTask(coreCompiler, unvalidatedConfig, 'build', sys);

          // first validate there was one call
          expect(taskBuildSpy).toHaveBeenCalledTimes(1);

          // verify the sys was passed through to the validated config
          const compilerSystemUsed: d.CompilerSystem = taskBuildSpy.mock.calls[0][1].sys;
          expect(compilerSystemUsed).toBe(sys);
        });
      });
    });

    it('calls the build task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'build', sys);

      expect(taskBuildSpy).toHaveBeenCalledTimes(1);
      // taskBuild now receives (coreCompiler, config, flags)
      expect(taskBuildSpy.mock.calls[0][0]).toBe(coreCompiler);
      expect(taskBuildSpy.mock.calls[0][1]).toHaveProperty('sys');
      expect(taskBuildSpy.mock.calls[0][2]).toHaveProperty('task', 'build');
    });

    it('calls the docs task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'docs', sys);

      expect(taskDocsSpy).toHaveBeenCalledTimes(1);
      // taskDocs receives (coreCompiler, config)
      expect(taskDocsSpy.mock.calls[0][0]).toBe(coreCompiler);
      expect(taskDocsSpy.mock.calls[0][1]).toHaveProperty('sys');
    });

    describe('generate task', () => {
      it("calls the generate task for the argument 'generate'", async () => {
        await runTask(coreCompiler, unvalidatedConfig, 'generate', sys);

        expect(taskGenerateSpy).toHaveBeenCalledTimes(1);
        // taskGenerate receives (config, flags)
        expect(taskGenerateSpy.mock.calls[0][0]).toHaveProperty('sys');
        expect(taskGenerateSpy.mock.calls[0][1]).toHaveProperty('task', 'generate');
      });

      it("calls the generate task for the argument 'g'", async () => {
        await runTask(coreCompiler, unvalidatedConfig, 'g', sys);

        expect(taskGenerateSpy).toHaveBeenCalledTimes(1);
        // taskGenerate receives (config, flags)
        expect(taskGenerateSpy.mock.calls[0][0]).toHaveProperty('sys');
        expect(taskGenerateSpy.mock.calls[0][1]).toHaveProperty('task', 'g');
      });
    });

    it('calls the help task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'help', sys);

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      // taskHelp receives (flags, logger, sys)
      expect(taskHelpSpy.mock.calls[0][0]).toHaveProperty('task', 'help');
      expect(taskHelpSpy.mock.calls[0][2]).toBe(sys);
    });

    it('calls the prerender task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'prerender', sys);

      expect(taskPrerenderSpy).toHaveBeenCalledTimes(1);
      // taskPrerender receives (coreCompiler, config, flags)
      expect(taskPrerenderSpy.mock.calls[0][0]).toBe(coreCompiler);
      expect(taskPrerenderSpy.mock.calls[0][1]).toHaveProperty('sys');
      expect(taskPrerenderSpy.mock.calls[0][2]).toHaveProperty('task', 'prerender');
    });

    it('calls the serve task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'serve', sys);

      expect(taskServeSpy).toHaveBeenCalledTimes(1);
      // taskServe receives (config, flags)
      expect(taskServeSpy.mock.calls[0][0]).toHaveProperty('sys');
      expect(taskServeSpy.mock.calls[0][1]).toHaveProperty('task', 'serve');
    });

    describe('telemetry task', () => {
      it('calls the telemetry task when a compiler system is present', async () => {
        await runTask(coreCompiler, unvalidatedConfig, 'telemetry', sys);

        expect(taskTelemetrySpy).toHaveBeenCalledTimes(1);
        // taskTelemetry receives (flags, sys, logger)
        expect(taskTelemetrySpy.mock.calls[0][0]).toHaveProperty('task', 'telemetry');
        expect(taskTelemetrySpy.mock.calls[0][1]).toBe(sys);
      });
    });

    it('defaults to the help task for an unaccounted for task name', async () => {
      // info is a valid task name, but isn't used in the `switch` statement of `runTask`
      await runTask(coreCompiler, unvalidatedConfig, 'info', sys);

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      // taskHelp receives (flags, logger, sys)
      expect(taskHelpSpy.mock.calls[0][0]).toHaveProperty('task', 'info');
      expect(taskHelpSpy.mock.calls[0][2]).toBe(sys);
    });

    it('defaults to the provided task if no flags exist on the provided config', async () => {
      unvalidatedConfig = mockConfig({ flags: undefined, sys });

      await runTask(coreCompiler, unvalidatedConfig, 'help', sys);

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      // taskHelp receives (flags, logger, sys)
      expect(taskHelpSpy.mock.calls[0][0]).toHaveProperty('task', 'help');
      expect(taskHelpSpy.mock.calls[0][2]).toBe(sys);
    });
  });
});
