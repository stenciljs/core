import type * as d from '@stencil/core';

export const validateWorkers = (config: d.ValidatedConfig) => {
  if (typeof config.maxConcurrentWorkers !== 'number') {
    config.maxConcurrentWorkers = 8;
  }

  // maxConcurrentWorkers is set via mergeFlags from --maxWorkers flag
  // Reduce workers in CI environments for stability
  if (config.ci) {
    config.maxConcurrentWorkers = Math.min(config.maxConcurrentWorkers, 4);
  }

  config.maxConcurrentWorkers = Math.max(Math.min(config.maxConcurrentWorkers, 16), 0);

  if (config.devServer) {
    config.devServer.worker = config.maxConcurrentWorkers > 0;
  }
};
