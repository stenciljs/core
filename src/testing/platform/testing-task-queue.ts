import type * as d from '@stencil/core/internal';

import { QueuedLoadModule } from './load-module';
import {
  caughtErrors,
  moduleLoaded,
  queuedLoadModules,
  queuedReadTasks,
  queuedTicks,
  queuedWriteTasks,
} from './testing-constants';

/**
 * Reset the various data structures related to the testing rendering pipeline
 */
export function resetTaskQueue(): void {
  queuedTicks.length = 0;
  queuedWriteTasks.length = 0;
  queuedReadTasks.length = 0;
  moduleLoaded.clear();
  queuedLoadModules.length = 0;
  caughtErrors.length = 0;
}

/**
 * Pushes the provided callback onto the {@link queuedTicks} data structure
 * @param cb the callback to add to `queuedTicks`
 */
export const nextTick = (cb: Function): void => {
  queuedTicks.push(cb);
};

/**
 * Execute the callbacks in {@link queuedTicks} on the next NodeJS tick.
 *
 * Callbacks are invoked in the order that they appear in `queuedTasks` at the time this function is invoked.
 * Async callbacks are not `await`ed.
 *
 * Any callbacks that are added to `queuedTasks` while this function is running are scheduled to be flushed on the
 * next tick.
 */
export function flushTicks(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    function drain() {
      try {
        if (queuedTicks.length > 0) {
          const writeTasks = queuedTicks.slice();

          queuedTicks.length = 0;

          let cb: Function;
          while ((cb = writeTasks.shift())) {
            cb(Date.now());
          }
        }

        if (queuedTicks.length > 0) {
          process.nextTick(drain);
        } else {
          resolve();
        }
      } catch (e) {
        reject(`flushTicks: ${e}`);
      }
    }

    process.nextTick(drain);
  });
}

/**
 * Push a RequestAnimationFrame callback onto the {@link queuedWriteTasks} data structure
 * @param cb the callback to push onto `queuedWriteTasks`
 */
export function writeTask(cb: d.RafCallback): void {
  queuedWriteTasks.push(cb);
}

/**
 * Push a RequestAnimationFrame callback onto the {@link queuedReadTasks} data structure
 * @param cb the callback to push onto `queuedReadTasks`
 */
export function readTask(cb: d.RafCallback): void {
  queuedReadTasks.push(cb);
}

/**
 * Flush the {@link queuedReadTasks} and {@link queuedWriteTasks} data structures on the next NodeJS process tick.
 *
 * The read task queue is drained first, followed by the write task queue.
 * For each queue:
 * - Each task is processed in the order it is found in its respective data structure at the time `queuedReadTasks` and
 * `queuedWriteTasks` are read (note: these queues are not read at the same time).
 * - When a task queue is processed, it is marked as empty before acting on the entries in the queue.
 * - Items added to either queue after it has been read for processing will be handled on the subsequent tick.
 * - Async items will be `await`ed
 */
export function flushQueue(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    async function drain() {
      try {
        if (queuedReadTasks.length > 0) {
          const readTasks = queuedReadTasks.slice();

          queuedReadTasks.length = 0;

          let cb: Function;
          while ((cb = readTasks.shift())) {
            const result = cb(Date.now());
            if (result != null && typeof result.then === 'function') {
              await result;
            }
          }
        }

        if (queuedWriteTasks.length > 0) {
          const writeTasks = queuedWriteTasks.slice();

          queuedWriteTasks.length = 0;

          let cb: Function;
          while ((cb = writeTasks.shift())) {
            const result = cb(Date.now());
            if (result != null && typeof result.then === 'function') {
              await result;
            }
          }
        }

        if (queuedReadTasks.length + queuedWriteTasks.length > 0) {
          process.nextTick(drain);
        } else {
          resolve();
        }
      } catch (e) {
        reject(`flushQueue: ${e}`);
      }
    }

    process.nextTick(drain);
  });
}

export async function flushAll(): Promise<void> {
  while (queuedTicks.length + queuedLoadModules.length + queuedWriteTasks.length + queuedReadTasks.length > 0) {
    await flushTicks();
    await flushLoadModule();
    await flushQueue();
  }
  if (caughtErrors.length > 0) {
    const err = caughtErrors[0];
    if (err == null) {
      throw new Error('Error!');
    }
    if (typeof err === 'string') {
      throw new Error(err);
    }
    throw err;
  }
  return new Promise<void>((resolve) => process.nextTick(resolve));
}

/**
 * Add a component module to the global {@link queuedLoadModules} data structure
 * @param cmpMeta the component compiler metadata of the component to eventually load
 * @param _hostRef an unused parameter for a Stencil HostRef instance
 * @param _hmrVersionId an unused parameter denoting the current hot-module reloading version
 * @returns A promise that loads the component onto `queuedLoadModules`
 */
export function loadModule(cmpMeta: d.ComponentRuntimeMeta, _hostRef: d.HostRef, _hmrVersionId?: string): Promise<any> {
  return new Promise<any>((resolve) => {
    queuedLoadModules.push({
      bundleId: cmpMeta.$lazyBundleId$,
      resolve: () => resolve(moduleLoaded.get(cmpMeta.$lazyBundleId$)),
    });
  });
}

export function flushLoadModule(bundleId?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      process.nextTick(() => {
        if (bundleId != null) {
          for (let i = 0; i < queuedLoadModules.length; i++) {
            if (queuedLoadModules[i].bundleId === bundleId) {
              queuedLoadModules[i].resolve();
              queuedLoadModules.splice(i, 1);
              i--;
            }
          }
        } else {
          let queuedLoadModule: QueuedLoadModule;
          while ((queuedLoadModule = queuedLoadModules.shift())) {
            queuedLoadModule.resolve();
          }
        }

        resolve();
      });
    } catch (e) {
      reject(`flushLoadModule: ${e}`);
    }
  });
}
