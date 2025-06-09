import type * as d from '../../declarations';

/**
 * Initialize a worker thread, setting up various machinery for managing
 * communication between the child process (worker) and the main thread.
 *
 * @param process a NodeJS process
 * @param msgHandler a worker message handler, which processes incoming
 * messages
 */
export const initNodeWorkerThread = (process: NodeJS.Process, msgHandler: d.WorkerMsgHandler) => {
  const sendHandle = (err: NodeJS.ErrnoException) => {
    if (err && err.code === 'ERR_IPC_CHANNEL_CLOSED') {
      process.exit(0);
    }
  };

  const errorHandler = (stencilMsgId: number, err: any) => {
    const errMsgBackToMain: d.MsgFromWorker<any> = {
      stencilId: stencilMsgId,
      stencilRtnValue: null,
      stencilRtnError: 'Error',
    };
    if (typeof err === 'string') {
      errMsgBackToMain.stencilRtnError += ': ' + err;
    } else if (err) {
      if (err.stack) {
        errMsgBackToMain.stencilRtnError += ': ' + err.stack;
      } else if (err.message) {
        errMsgBackToMain.stencilRtnError += ':' + err.message;
      }
    }
    process.send(errMsgBackToMain, sendHandle);
  };

  process.on('message', async <T extends d.WorkerContextMethod>(msgToWorker: d.MsgToWorker<T>) => {
    // message from the main thread
    if (msgToWorker && typeof msgToWorker.stencilId === 'number') {
      try {
        // run the handler to get the data
        const msgFromWorker: d.MsgFromWorker<T> = {
          stencilId: msgToWorker.stencilId,
          stencilRtnValue: await msgHandler(msgToWorker),
          stencilRtnError: null,
        };

        // send response data from the worker to the main thread
        process.send(msgFromWorker, sendHandle);
      } catch (e) {
        // error occurred while running the task
        errorHandler(msgToWorker.stencilId, e);
      }
    }
  });

  process.on(`unhandledRejection`, (e: any) => {
    errorHandler(-1, e);
  });
};
