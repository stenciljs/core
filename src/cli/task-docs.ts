import { isOutputTargetDocs } from '@utils';

import type { ValidatedConfig } from '../declarations';
import type { CoreCompiler } from './load-compiler';
import { startupCompilerLog } from './logs';

export const taskDocs = async (coreCompiler: CoreCompiler, config: ValidatedConfig) => {
  config.devServer = {};
  config.outputTargets = config.outputTargets.filter(isOutputTargetDocs);
  config.devMode = true;

  startupCompilerLog(coreCompiler, config);

  const compiler = await coreCompiler.createCompiler(config);
  await compiler.build();

  await compiler.destroy();
};
