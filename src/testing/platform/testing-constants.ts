import type * as d from '@stencil/core/internal';

import { QueuedLoadModule } from './load-module';

export const styles: d.StyleMap = new Map();
export const modeResolutionChain: d.ResolutionHandler[] = [];

/**
 * A mapping of custom element tags (e.g. `my-component`) to their constructor
 */
export const cstrs = new Map<string, d.ComponentTestingConstructor>();
/**
 * A collection of callbacks to run on a NodeJS process 'tick'
 */
export const queuedTicks: Function[] = [];
export const queuedWriteTasks: d.RafCallback[] = [];
export const queuedReadTasks: d.RafCallback[] = [];
export const moduleLoaded = new Map<string, d.ComponentTestingConstructor>();
export const queuedLoadModules: QueuedLoadModule[] = [];
/**
 * A collection of errors that were detected to surface during the rendering process
 */
export const caughtErrors: Error[] = [];
