import { BUILD } from '@app-data';

import type * as d from '../declarations';
import { PLATFORM_FLAGS } from '../runtime/runtime-constants';
import { consoleError } from './client-log';
import { plt, promiseResolve } from './client-window';

let queueCongestion = 0;
let queuePending = false;

const queueDomReads: d.RafCallback[] = [];
const queueDomWrites: d.RafCallback[] = [];
const queueDomWritesLow: d.RafCallback[] = [];

const queueTask = (queue: d.RafCallback[], write: boolean) => (cb: d.RafCallback) => {
  queue.push(cb);

  if (!queuePending) {
    queuePending = true;
    if (write && plt.$flags$ & PLATFORM_FLAGS.queueSync) {
      nextTick(flush);
    } else {
      plt.raf(flush);
    }
  }
};

const consume = (queue: d.RafCallback[]) => {
  for (let i = 0; i < queue.length; i++) {
    try {
      queue[i](performance.now());
    } catch (e) {
      consoleError(e);
    }
  }
  queue.length = 0;
};

const consumeTimeout = (queue: d.RafCallback[], timeout: number) => {
  let i = 0;
  let ts = 0;
  while (i < queue.length && (ts = performance.now()) < timeout) {
    try {
      queue[i++](ts);
    } catch (e) {
      consoleError(e);
    }
  }
  if (i === queue.length) {
    queue.length = 0;
  } else if (i !== 0) {
    queue.splice(0, i);
  }
};

const flush = () => {
  if (BUILD.asyncQueue) {
    queueCongestion++;
  }

  // always force a bunch of medium callbacks to run, but still have
  // a throttle on how many can run in a certain time

  // DOM READS!!!
  consume(queueDomReads);

  // DOM WRITES!!!
  if (BUILD.asyncQueue) {
    const timeout =
      (plt.$flags$ & PLATFORM_FLAGS.queueMask) === PLATFORM_FLAGS.appLoaded
        ? performance.now() + 14 * Math.ceil(queueCongestion * (1.0 / 10.0))
        : Infinity;

    consumeTimeout(queueDomWrites, timeout);
    consumeTimeout(queueDomWritesLow, timeout);

    if (queueDomWrites.length > 0) {
      queueDomWritesLow.push(...queueDomWrites);
      queueDomWrites.length = 0;
    }

    if ((queuePending = queueDomReads.length + queueDomWrites.length + queueDomWritesLow.length > 0)) {
      // still more to do yet, but we've run out of time
      // let's let this thing cool off and try again in the next tick
      plt.raf(flush);
    } else {
      queueCongestion = 0;
    }
  } else {
    consume(queueDomWrites);
    if ((queuePending = queueDomReads.length > 0)) {
      // still more to do yet, but we've run out of time
      // let's let this thing cool off and try again in the next tick
      plt.raf(flush);
    }
  }
};

export const nextTick = (cb: () => void) => promiseResolve().then(cb);

export const readTask = /*@__PURE__*/ queueTask(queueDomReads, false);

export const writeTask = /*@__PURE__*/ queueTask(queueDomWrites, true);
