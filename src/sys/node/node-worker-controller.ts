import { TASK_CANCELED_MSG } from '@utils';
import { EventEmitter } from 'events';
import { cpus } from 'os';

import type * as d from '../../declarations';
import { NodeWorkerMain } from './node-worker-main';

/**
 * A custom EventEmitter which provides centralizes dispatching and control for
 * node.js workers ({@link NodeWorkerMain} instances)
 */
export class NodeWorkerController extends EventEmitter implements d.WorkerMainController {
  workerIds = 0;
  stencilId = 0;
  isEnding = false;
  taskQueue: d.CompilerWorkerTask[] = [];
  workers: NodeWorkerMain[] = [];
  maxWorkers: number;
  useForkedWorkers: boolean;
  mainThreadRunner: { [fnName: string]: (...args: any[]) => Promise<any> };

  /**
   * Create a node.js-specific worker controller, which controls and
   * coordinates distributing tasks to a series of child processes (tracked by
   * {@link NodeWorkerMain} instances). These child processes are node
   * processes executing a special worker script (`src/sys/node/worker.ts`)
   * which listens for {@link d.MsgToWorker} messages and runs certain tasks in
   * response.
   *
   * @param forkModulePath the path to the module which k
   * @param maxConcurrentWorkers the max number of worker threads to spin up
   */
  constructor(
    public forkModulePath: string,
    maxConcurrentWorkers: number,
  ) {
    super();
    const osCpus = cpus().length;

    this.useForkedWorkers = maxConcurrentWorkers > 0;
    this.maxWorkers = Math.max(Math.min(maxConcurrentWorkers, osCpus), 2) - 1;

    if (this.useForkedWorkers) {
      // start up the forked child processes
      this.startWorkers();
    } else {
      // run on the main thread by just requiring the module
      this.mainThreadRunner = require(forkModulePath);
    }
  }

  onError(err: NodeJS.ErrnoException, workerId: number) {
    if (err.code === 'ERR_IPC_CHANNEL_CLOSED') {
      return this.stopWorker(workerId);
    }
    if (err.code !== 'EPIPE') {
      console.error(err);
    }
  }

  onExit(workerId: number) {
    setTimeout(() => {
      let doQueue = false;
      const worker = this.workers.find((w) => w.id === workerId);

      if (worker) {
        worker.tasks.forEach((t) => {
          t.retries++;
          this.taskQueue.unshift(t);
          doQueue = true;
        });
        worker.tasks.clear();
      }

      this.stopWorker(workerId);

      if (doQueue) {
        this.processTaskQueue();
      }
    }, 10);
  }

  startWorkers() {
    while (this.workers.length < this.maxWorkers) {
      this.startWorker();
    }
  }

  startWorker() {
    const workerId = this.workerIds++;
    const worker = new NodeWorkerMain(workerId, this.forkModulePath);

    worker.on('response', this.processTaskQueue.bind(this));

    worker.once('exit', () => {
      this.onExit(workerId);
    });

    worker.on('error', (err) => {
      this.onError(err, workerId);
    });

    this.workers.push(worker);
  }

  stopWorker(workerId: number) {
    const worker = this.workers.find((w) => w.id === workerId);
    if (worker) {
      worker.stop();

      const index = this.workers.indexOf(worker);
      if (index > -1) {
        this.workers.splice(index, 1);
      }
    }
  }

  processTaskQueue() {
    if (this.isEnding) {
      return;
    }

    if (this.useForkedWorkers) {
      this.startWorkers();
    }

    while (this.taskQueue.length > 0) {
      const worker = getNextWorker(this.workers);
      if (!worker) {
        break;
      }
      worker.run(this.taskQueue.shift());
    }
  }

  send(...args: any[]) {
    if (this.isEnding) {
      return Promise.reject(TASK_CANCELED_MSG);
    }

    if (this.useForkedWorkers) {
      // queue to be sent to a forked child process
      return new Promise<any>((resolve, reject) => {
        const task: d.CompilerWorkerTask = {
          stencilId: this.stencilId++,
          inputArgs: args,
          retries: 0,
          resolve: resolve,
          reject: reject,
        };
        this.taskQueue.push(task);

        this.processTaskQueue();
      });
    }

    // run on the main thread, no forked child processes
    return this.mainThreadRunner[args[0]].apply(null, args.slice(1));
  }

  handler(name: string) {
    return (...args: any[]) => {
      return this.send(name, ...args);
    };
  }

  cancelTasks() {
    for (const worker of this.workers) {
      worker.tasks.forEach((t) => t.reject(TASK_CANCELED_MSG));
      worker.tasks.clear();
    }
    this.taskQueue.length = 0;
  }

  destroy() {
    if (!this.isEnding) {
      this.isEnding = true;

      for (const task of this.taskQueue) {
        task.reject(TASK_CANCELED_MSG);
      }

      this.taskQueue.length = 0;

      const workerIds = this.workers.map((w) => w.id);
      for (const workerId of workerIds) {
        this.stopWorker(workerId);
      }
    }
  }
}

export function getNextWorker(workers: NodeWorkerMain[]) {
  const availableWorkers = workers.filter((w) => {
    if (w.stopped) {
      // nope, don't use this worker if it's exiting
      return false;
    }

    // this is an available worker up for the job, bring it!
    return true;
  });

  if (availableWorkers.length === 0) {
    // all workers are pretty tasked at the moment
    // Please come back again. Thank you for your business.
    return null;
  }

  const sorted = availableWorkers.sort((a, b) => {
    // worker with the fewest active tasks first
    if (a.tasks.size < b.tasks.size) return -1;
    if (a.tasks.size > b.tasks.size) return 1;

    // all workers have the same number of active tasks, so next sort
    // by worker with the fewest total tasks that have been assigned
    if (a.totalTasksAssigned < b.totalTasksAssigned) return -1;
    if (a.totalTasksAssigned > b.totalTasksAssigned) return 1;

    return 0;
  });

  return sorted[0];
}
