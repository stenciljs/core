import { shouldIgnoreError } from '@utils';

import type { Logger } from '../../declarations';

export function setupNodeProcess(c: { process: any; logger: Logger }) {
  c.process.on(`unhandledRejection`, (e: any) => {
    if (!shouldIgnoreError(e)) {
      let msg = 'unhandledRejection';
      if (e != null) {
        if (typeof e === 'string') {
          msg += ': ' + e;
        } else if (e.stack) {
          msg += ': ' + e.stack;
        } else if (e.message) {
          msg += ': ' + e.message;
        }
      }
      c.logger.error(msg);
    }
  });
}
