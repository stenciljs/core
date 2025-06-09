import type * as d from '../../declarations';
import { optimizeCss } from '../optimize/optimize-css';
import { prepareModule } from '../optimize/optimize-module';
import { prerenderWorker } from '../prerender/prerender-worker';
import { transformCssToEsm } from '../style/css-to-esm';

/**
 * Instantiate a worker context which synchronously calls the methods that are
 * defined on it (as opposed to dispatching them to a worker in another thread
 * via a worker controller). We want to do this in two cases:
 *
 * 1. we're in the main thread and not using any workers at all (i.e. the value
 *    for {@link d.Config['maxConcurrentWorkers']} is set to `1`) or
 * 2. we're already in a worker thread, so we want to call the method directly
 *    instead of dispatching.
 *
 * @param sys a compiler system appropriate for our current environment
 * @returns a worker context which directly calls the supported methods
 */
export const createWorkerContext = (sys: d.CompilerSystem): d.CompilerWorkerContext => ({
  transformCssToEsm,
  prepareModule,
  optimizeCss,
  prerenderWorker: (prerenderRequest) => prerenderWorker(sys, prerenderRequest),
});

/**
 * Create a handler for the IPC messages ({@link d.MsgToWorker}) that a worker
 * thread receives from the main thread. For each message that we receive we
 * need to call a specific method on {@link d.CompilerWorkerContext} and then
 * return the result
 *
 * @param sys a compiler system which wil be used to create a worker context
 * @returns a message handler capable of digesting and executing tasks
 * described by {@link d.MsgToWorker} object
 */
export const createWorkerMessageHandler = (sys: d.CompilerSystem): d.WorkerMsgHandler => {
  const workerCtx = createWorkerContext(sys);

  return <T extends d.WorkerContextMethod>(msgToWorker: d.MsgToWorker<T>): ReturnType<d.CompilerWorkerContext[T]> => {
    const fnName = msgToWorker.method;
    const fnArgs = msgToWorker.args;
    const fn = workerCtx[fnName];
    // This is actually fine! However typescript doesn't agree. Both the
    // `Parameters` and the `ReturnType` arguments return a union of tuples in
    // the case where their parameter is generic over some type (e.g. `T` here)
    // but, annoyingly, TypeScript does not think that you can spread a value
    // whose type is a union of tuples as a rest param. Even though the type of
    // `fn` and `fnArgs` should 'match' given the type `T` that they are
    // generic over, TypeScript does not seem able to realize that and can't
    // narrow the type of `fn` _or_ `fnArgs` properly, so the type for the
    // parameters of `fn` _and_ the type of `fnArgs` remains a union of tuples.
    // Gah!
    //
    // See this issue for some context on this:
    // https://github.com/microsoft/TypeScript/issues/49700
    //
    // Unfortunately there's not a great solution here other than:
    // @ts-ignore
    return fn(...fnArgs);
  };
};
