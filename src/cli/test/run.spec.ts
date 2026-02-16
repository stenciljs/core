import * as coreCompiler from '@stencil/core/compiler';
import { mockCompilerSystem, mockConfig, mockLogger as createMockLogger } from '@stencil/core/testing';

import type * as d from '../../declarations';
import { createTestingSystem } from '../../testing/testing-sys';
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
import * as TestTask from '../task-test';

describe('run', () => {
  describe('run()', () => {
    let cliInitOptions: d.CliInitOptions;
    let mockLogger: d.Logger;
    let mockSystem: d.CompilerSystem;

    let parseFlagsSpy: jest.SpyInstance<
      ReturnType<typeof ParseFlags.parseFlags>,
      Parameters<typeof ParseFlags.parseFlags>
    >;

    beforeEach(() => {
      mockLogger = createMockLogger();
      mockSystem = createTestingSystem();

      cliInitOptions = {
        args: [],
        logger: mockLogger,
        sys: mockSystem,
      };

      parseFlagsSpy = jest.spyOn(ParseFlags, 'parseFlags');
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
      let taskHelpSpy: jest.SpyInstance<ReturnType<typeof HelpTask.taskHelp>, Parameters<typeof HelpTask.taskHelp>>;

      beforeEach(() => {
        taskHelpSpy = jest.spyOn(HelpTask, 'taskHelp');
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

    let taskBuildSpy: jest.SpyInstance<ReturnType<typeof BuildTask.taskBuild>, Parameters<typeof BuildTask.taskBuild>>;
    let taskDocsSpy: jest.SpyInstance<ReturnType<typeof DocsTask.taskDocs>, Parameters<typeof DocsTask.taskDocs>>;
    let taskGenerateSpy: jest.SpyInstance<
      ReturnType<typeof GenerateTask.taskGenerate>,
      Parameters<typeof GenerateTask.taskGenerate>
    >;
    let taskHelpSpy: jest.SpyInstance<ReturnType<typeof HelpTask.taskHelp>, Parameters<typeof HelpTask.taskHelp>>;
    let taskPrerenderSpy: jest.SpyInstance<
      ReturnType<typeof PrerenderTask.taskPrerender>,
      Parameters<typeof PrerenderTask.taskPrerender>
    >;
    let taskServeSpy: jest.SpyInstance<ReturnType<typeof ServeTask.taskServe>, Parameters<typeof ServeTask.taskServe>>;
    let taskTelemetrySpy: jest.SpyInstance<
      ReturnType<typeof TelemetryTask.taskTelemetry>,
      Parameters<typeof TelemetryTask.taskTelemetry>
    >;
    let taskTestSpy: jest.SpyInstance<ReturnType<typeof TestTask.taskTest>, Parameters<typeof TestTask.taskTest>>;

    beforeEach(() => {
      sys = mockCompilerSystem();
      sys.exit = jest.fn();

      unvalidatedConfig = mockConfig({ outputTargets: [], sys, fsNamespace: 'testing' });

      taskBuildSpy = jest.spyOn(BuildTask, 'taskBuild');
      taskBuildSpy.mockResolvedValue();

      taskDocsSpy = jest.spyOn(DocsTask, 'taskDocs');
      taskDocsSpy.mockResolvedValue();

      taskGenerateSpy = jest.spyOn(GenerateTask, 'taskGenerate');
      taskGenerateSpy.mockResolvedValue();

      taskHelpSpy = jest.spyOn(HelpTask, 'taskHelp');
      taskHelpSpy.mockResolvedValue();

      taskPrerenderSpy = jest.spyOn(PrerenderTask, 'taskPrerender');
      taskPrerenderSpy.mockResolvedValue();

      taskServeSpy = jest.spyOn(ServeTask, 'taskServe');
      taskServeSpy.mockResolvedValue();

      taskTelemetrySpy = jest.spyOn(TelemetryTask, 'taskTelemetry');
      taskTelemetrySpy.mockResolvedValue();

      taskTestSpy = jest.spyOn(TestTask, 'taskTest');
      taskTestSpy.mockResolvedValue();
    });

    afterEach(() => {
      taskBuildSpy.mockRestore();
      taskDocsSpy.mockRestore();
      taskGenerateSpy.mockRestore();
      taskHelpSpy.mockRestore();
      taskPrerenderSpy.mockRestore();
      taskServeSpy.mockRestore();
      taskTelemetrySpy.mockRestore();
      taskTestSpy.mockRestore();
    });

    describe('default configuration', () => {
      describe('sys property', () => {
        it('uses the sys argument if one is provided', async () => {
          // remove the `CompilerSystem` on the config, just to be sure we don't accidentally use it
          unvalidatedConfig.sys = undefined;

          await runTask(coreCompiler, unvalidatedConfig, 'build', sys);
          const validated = coreCompiler.validateConfig(unvalidatedConfig, { sys });

          // first validate there was one call, and that call had two arguments
          expect(taskBuildSpy).toHaveBeenCalledTimes(1);
          expect(taskBuildSpy).toHaveBeenCalledWith(coreCompiler, validated.config);

          const compilerSystemUsed: d.CompilerSystem = taskBuildSpy.mock.calls[0][1].sys;
          expect(compilerSystemUsed).toBe(sys);
        });
      });
    });

    it('calls the build task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'build', sys);
      const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

      expect(taskBuildSpy).toHaveBeenCalledTimes(1);
      expect(taskBuildSpy).toHaveBeenCalledWith(coreCompiler, validated.config);
    });

    it('calls the docs task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'docs', sys);
      const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

      expect(taskDocsSpy).toHaveBeenCalledTimes(1);
      expect(taskDocsSpy).toHaveBeenCalledWith(coreCompiler, validated.config);
    });

    describe('generate task', () => {
      it("calls the generate task for the argument 'generate'", async () => {
        await runTask(coreCompiler, unvalidatedConfig, 'generate', sys);
        const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

        expect(taskGenerateSpy).toHaveBeenCalledTimes(1);
        expect(taskGenerateSpy).toHaveBeenCalledWith(validated.config);
      });

      it("calls the generate task for the argument 'g'", async () => {
        await runTask(coreCompiler, unvalidatedConfig, 'g', sys);
        const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

        expect(taskGenerateSpy).toHaveBeenCalledTimes(1);
        expect(taskGenerateSpy).toHaveBeenCalledWith(validated.config);
      });
    });

    it('calls the help task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'help', sys);
      const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      expect(taskHelpSpy).toHaveBeenCalledWith(validated.config.flags, validated.config.logger, sys);
    });

    it('calls the prerender task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'prerender', sys);
      const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

      expect(taskPrerenderSpy).toHaveBeenCalledTimes(1);
      expect(taskPrerenderSpy).toHaveBeenCalledWith(coreCompiler, validated.config);
    });

    it('calls the serve task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'serve', sys);

      expect(taskServeSpy).toHaveBeenCalledTimes(1);
      expect(taskServeSpy).toHaveBeenCalledWith(coreCompiler.validateConfig(unvalidatedConfig, {}).config);
    });

    describe('telemetry task', () => {
      it('calls the telemetry task when a compiler system is present', async () => {
        await runTask(coreCompiler, unvalidatedConfig, 'telemetry', sys);
        const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

        expect(taskTelemetrySpy).toHaveBeenCalledTimes(1);
        expect(taskTelemetrySpy).toHaveBeenCalledWith(validated.config.flags, sys, validated.config.logger);
      });
    });

    it('calls the test task', async () => {
      await runTask(coreCompiler, unvalidatedConfig, 'test', sys);

      expect(taskTestSpy).toHaveBeenCalledTimes(1);
      expect(taskTestSpy).toHaveBeenCalledWith(coreCompiler.validateConfig(unvalidatedConfig, {}).config);
    });

    it('defaults to the help task for an unaccounted for task name', async () => {
      // info is a valid task name, but isn't used in the `switch` statement of `runTask`
      await runTask(coreCompiler, unvalidatedConfig, 'info', sys);
      const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      expect(taskHelpSpy).toHaveBeenCalledWith(validated.config.flags, validated.config.logger, sys);
    });

    it('defaults to the provided task if no flags exist on the provided config', async () => {
      unvalidatedConfig = mockConfig({ flags: undefined, sys });

      await runTask(coreCompiler, unvalidatedConfig, 'help', sys);
      const validated = coreCompiler.validateConfig(unvalidatedConfig, {});

      expect(taskHelpSpy).toHaveBeenCalledTimes(1);
      expect(taskHelpSpy).toHaveBeenCalledWith(createConfigFlags({ task: 'help' }), validated.config.logger, sys);
    });
  });
});
