import type * as d from '@stencil/core/declarations';
import { isFunction } from '@utils';

import { createWorkerMainContext } from '../../worker/main-thread';
import { createWorkerContext } from '../../worker/worker-thread';

/**
 * Create a worker context given a Stencil config. If
 * {@link d.Config['maxConcurrentWorkers']} is set to an appropriate value this
 * will be a worker context that dispatches work to other threads, and if not it
 * will be a single-threaded worker context.
 *
 * @param config the current stencil config
 * @returns a worker context
 */
export const createSysWorker = (config: d.ValidatedConfig): d.CompilerWorkerContext => {
  if (
    isFunction(config.sys.createWorkerController) &&
    config.maxConcurrentWorkers > 0 &&
    config.sys.hardwareConcurrency > 1
  ) {
    const workerCtrl = config.sys.createWorkerController(config.maxConcurrentWorkers);

    config.sys.addDestroy(() => workerCtrl.destroy());

    config.logger.debug(`create workers, maxWorkers: ${workerCtrl.maxWorkers}`);
    return createWorkerMainContext(workerCtrl);
  }

  config.logger.debug(
    `no workers, maxConcurrentWorkers: ${config.maxConcurrentWorkers}, hardwareConcurrency: ${config.sys.hardwareConcurrency}`,
  );
  return createWorkerContext(config.sys);
};
