import type { CompilerSystem, Logger } from '@stencil/core/internal';

/**
 * Creates a "logger", based off of NodeJS APIs, that will be used by the compiler and dev-server.
 * The NodeJS "process" object must be provided as a property in the first argument's object.
 * @returns a {@link Logger} object
 */
export declare function createNodeLogger(): Logger;

// TODO(STENCIL-1196): Remove in Stencil v5, use `createNodeLogger` without parameters instead
/**
 * Creates a "logger", based off of NodeJS APIs, that will be used by the compiler and dev-server.
 * The NodeJS "process" object must be provided as a property in the first argument's object.
 * @param c an object containing a `Process` for Stencil to use and a logger instanced created by {@link createNodeLogger}
 * @returns a {@link Logger} object
 * @deprecated Use {@link createNodeLogger} without parameters instead
 */
export declare function createNodeLogger(c: { process: any }): Logger;

/**
 * Creates the "system", based off of NodeJS APIs, used by the compiler. This includes any and
 * all file system reads and writes using NodeJS. The compiler itself is unaware of Node's
 * `fs` module. Other system APIs include any use of `crypto` to hash content. The NodeJS
 * "process" object must be provided as a property in the first argument's object.
 * @param c an object containing a `Process` for Stencil to use and a logger instanced created by {@link createNodeLogger}
 * @returns a {@link CompilerSystem} object
 */
export declare function createNodeSys(c: { process?: any; logger?: any }): CompilerSystem;

/**
 * Sets up the NodeJS process to be used by Stencil. This includes setting up the process's
 * `exit` and `uncaughtException` events to be handled by Stencil's logger.
 * @param c an object containing a `Process` for Stencil to use and a logger instanced created by {@link createNodeLogger}
 */
export declare function setupNodeProcess(c: { process: any; logger: Logger }): void;

export { CompilerSystem, Logger };
