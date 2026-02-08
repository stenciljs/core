import { CompilerWorkerContext, WorkerMainController } from '../../declarations';

/**
 * Instantiate a worker context which is specific to the 'main thread' and
 * which dispatches the tasks it receives to a {@link WorkerMainController}
 * (and, thereby, to workers in other threads).
 *
 * @param workerCtrl a worker controller which can handle the methods on the
 * context by passing them to worker threads
 * @returns a worker context
 */
export const createWorkerMainContext = (workerCtrl: WorkerMainController): CompilerWorkerContext => ({
  optimizeCss: workerCtrl.handler('optimizeCss'),
  prepareModule: workerCtrl.handler('prepareModule'),
  prerenderWorker: workerCtrl.handler('prerenderWorker'),
  transformCssToEsm: workerCtrl.handler('transformCssToEsm'),
});
