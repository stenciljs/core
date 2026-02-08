import type { Logger } from '@stencil/core/declarations';
import fs from 'graceful-fs';
import path from 'path';

import { createTerminalLogger, TerminalLoggerSys } from './terminal-logger';

/**
 * Create a logger to run in a Node environment
 *
 * @returns the created logger
 */
export const createNodeLogger = (): Logger => {
  const loggerSys = createNodeLoggerSys();
  const logger = createTerminalLogger(loggerSys);
  return logger;
};

/**
 * Create a logger sys object for use in a Node.js environment
 *
 * The `TerminalLoggerSys` interface basically abstracts away some
 * environment-specific details so that the terminal logger can deal with
 * things in a (potentially) platform-agnostic way.
 *
 * @returns a configured logger sys object
 */
export function createNodeLoggerSys(): TerminalLoggerSys {
  const cwd = () => process.cwd();

  const emoji = (emoji: string) => (process.platform !== 'win32' ? emoji : '');

  /**
   * Get the number of columns for the terminal to use when printing
   * @returns the number of columns to use
   */
  const getColumns = () => {
    const min_columns = 60;
    const max_columns = 120;
    const defaultWidth = 80;

    const terminalWidth = process?.stdout?.columns ?? defaultWidth;
    return Math.max(Math.min(terminalWidth, max_columns), min_columns);
  };

  const memoryUsage = () => process.memoryUsage().rss;

  const relativePath = (from: string, to: string) => path.relative(from, to);

  const writeLogs = (logFilePath: string, log: string, append: boolean) => {
    if (append) {
      try {
        fs.accessSync(logFilePath);
      } catch (e) {
        append = false;
      }
    }

    if (append) {
      fs.appendFileSync(logFilePath, log);
    } else {
      fs.writeFileSync(logFilePath, log);
    }
  };

  const createLineUpdater = async () => {
    const readline = await import('readline');
    let promise = Promise.resolve();
    const update = (text: string) => {
      text = text.substring(0, process.stdout.columns - 5) + '\x1b[0m';
      return (promise = promise.then(() => {
        return new Promise<any>((resolve) => {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0, undefined);
          process.stdout.write(text, resolve);
        });
      }));
    };

    const stop = () => {
      return update('\x1B[?25h');
    };

    // hide cursor
    process.stdout.write('\x1B[?25l');
    return {
      update,
      stop,
    };
  };

  return {
    cwd,
    emoji,
    getColumns,
    memoryUsage,
    relativePath,
    writeLogs,
    createLineUpdater,
  };
}
