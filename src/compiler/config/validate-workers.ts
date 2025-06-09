import type * as d from '../../declarations';

export const validateWorkers = (config: d.ValidatedConfig) => {
  if (typeof config.maxConcurrentWorkers !== 'number') {
    config.maxConcurrentWorkers = 8;
  }

  if (typeof config.flags.maxWorkers === 'number') {
    config.maxConcurrentWorkers = config.flags.maxWorkers;
  } else if (config.flags.ci) {
    config.maxConcurrentWorkers = 4;
  }

  config.maxConcurrentWorkers = Math.max(Math.min(config.maxConcurrentWorkers, 16), 0);

  if (config.devServer) {
    config.devServer.worker = config.maxConcurrentWorkers > 0;
  }
};
