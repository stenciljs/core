import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { createTestCompiler } from '../../../testing/create-test-compiler';

describe('createWatchBuild', () => {
  // Regression test: on a freshly-scaffolded project (no components.d.ts on disk),
  // build() intentionally returns null so watch-build can restart with a fresh TS
  // program (see build.ts). onBuild must actually perform that restart, otherwise
  // `stencil dev` on a brand new project hangs forever after "generated app types".
  it('restarts and finishes the first build when components.d.ts does not exist yet', async () => {
    const { compiler, config } = await createTestCompiler();

    // Undo createTestCompiler's components.d.ts pre-seed to reproduce a fresh project.
    // An initial commit() clears the pending queueWriteToDisk flag from the pre-seed
    // write, otherwise the later remove() is a silent no-op (commit() just rewrites it).
    await compiler.fs.commit();
    await compiler.fs.remove(path.join(config.srcDir, 'components.d.ts'));
    await compiler.fs.commit();

    const watcher = await compiler.createWatcher();

    const firstBuildFinished = new Promise<d.CompilerBuildResults>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for buildFinish')), 5000);
      watcher.on('buildFinish', (results) => {
        clearTimeout(timer);
        resolve(results);
      });
    });

    const startPromise = watcher.start();

    const results = await firstBuildFinished;
    expect(results.hasError).toBe(false);

    await watcher.close();
    await startPromise;
  });
});
