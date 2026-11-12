import { mockCompilerSystem, mockLogger, mockValidatedConfig } from '@stencil/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core/compiler';

import { createConfigFlags } from '../config-flags';
import { taskDocs } from '../task-docs';
import * as WatchTask from '../task-watch';
import type { CoreCompiler } from '../load-compiler';

describe('taskDocs', () => {
  let config: d.ValidatedConfig;
  let build: ReturnType<typeof vi.fn>;
  let coreCompiler: CoreCompiler;

  beforeEach(() => {
    const sys = mockCompilerSystem();
    sys.exit = vi.fn();
    config = mockValidatedConfig({
      sys,
      logger: mockLogger(),
      suppressLogs: true,
      outputTargets: [
        { type: 'www' },
        { type: 'docs-readme', skipInDev: true },
        { type: 'docs-json', file: 'docs.json' },
      ],
    });

    build = vi.fn().mockResolvedValue({ hasError: false });
    coreCompiler = {
      version: '0.0.0',
      createCompiler: vi.fn().mockResolvedValue({ build, destroy: vi.fn() }),
    } as Partial<CoreCompiler> as CoreCompiler;
  });

  it('builds only the docs output targets, none of them skipped', async () => {
    await taskDocs(coreCompiler, config, createConfigFlags({ task: 'docs' }));

    expect(build).toHaveBeenCalledTimes(1);
    expect(config.devMode).toBe(true);
    expect(config.outputTargets).toEqual([
      expect.objectContaining({ type: 'docs-readme', skipInDev: false }),
      expect.objectContaining({ type: 'docs-json', skipInDev: false }),
    ]);
    expect(config.sys.exit).not.toHaveBeenCalled();
  });

  it('exits non-zero when the build has errors', async () => {
    build.mockResolvedValue({ hasError: true });

    await taskDocs(coreCompiler, config, createConfigFlags({ task: 'docs' }));

    expect(config.sys.exit).toHaveBeenCalledWith(1);
  });

  it('warns and does not build when no docs output targets are configured', async () => {
    config.outputTargets = [{ type: 'www' }];
    const warn = vi.spyOn(config.logger, 'warn');

    await taskDocs(coreCompiler, config, createConfigFlags({ task: 'docs' }));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No docs output targets'));
    expect(coreCompiler.createCompiler).not.toHaveBeenCalled();
  });

  it('hands off to the watch task with --watch, never serving', async () => {
    const taskWatch = vi.spyOn(WatchTask, 'taskWatch').mockResolvedValue();

    await taskDocs(
      coreCompiler,
      config,
      createConfigFlags({ task: 'docs', watch: true, serve: true }),
    );

    expect(taskWatch).toHaveBeenCalledWith(
      coreCompiler,
      config,
      expect.objectContaining({ watch: true, serve: false }),
    );
    expect(build).not.toHaveBeenCalled();
    taskWatch.mockRestore();
  });
});
