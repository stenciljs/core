import { isOutputTargetDocs } from '@stencil/core/compiler/utils';
import type { ValidatedConfig } from '@stencil/core/compiler';

import { startupCompilerLog } from './logs';
import { taskWatch } from './task-watch';
import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';

export const taskDocs = async (
  coreCompiler: CoreCompiler,
  config: ValidatedConfig,
  flags: ConfigFlags,
) => {
  config.devServer = {};
  config.outputTargets = config.outputTargets.filter(isOutputTargetDocs);
  config.devMode = true;
  // an explicit `stencil docs` always generates every docs target
  config.outputTargets.forEach((o) => (o.skipInDev = false));

  if (config.outputTargets.length === 0) {
    config.logger.warn(
      `No docs output targets are configured, so there is nothing to generate. Add one to "outputTargets" (e.g. { type: 'docs-readme' }) or use --docsJson <path>.`,
    );
    return;
  }

  if (flags.watch) {
    await taskWatch(coreCompiler, config, { ...flags, serve: false });
    return;
  }

  startupCompilerLog(coreCompiler, config);

  const compiler = await coreCompiler.createCompiler(config);
  const results = await compiler.build();

  await compiler.destroy();

  if (results.hasError) {
    return config.sys.exit(1);
  }
};
