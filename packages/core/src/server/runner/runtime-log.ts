import { MockWindow } from '@stencil/core/mock-doc';

import type * as d from '../../declarations';
import { renderBuildDiagnostic, renderCatchError } from './render-utils';

export function runtimeLogging(win: MockWindow, opts: d.HydrateDocumentOptions, results: d.HydrateResults) {
  try {
    const pathname = win.location.pathname;

    win.console.error = (...msgs: any[]) => {
      const errMsg = msgs
        .reduce<string>((errMsg, m) => {
          if (m) {
            if (m.stack != null) {
              return errMsg + ' ' + String(m.stack);
            } else {
              if (m.message != null) {
                return errMsg + ' ' + String(m.message);
              }
            }
          }
          return String(m);
        }, '')
        .trim();

      if (errMsg !== '') {
        renderCatchError(results, errMsg);

        if (opts.runtimeLogging) {
          runtimeLog(pathname, 'error', [errMsg]);
        }
      }
    };

    win.console.debug = (...msgs: any[]) => {
      renderBuildDiagnostic(results, 'debug', 'Hydrate Debug', [...msgs].join(', '));
      if (opts.runtimeLogging) {
        runtimeLog(pathname, 'debug', msgs);
      }
    };

    if (opts.runtimeLogging) {
      ['log', 'warn', 'assert', 'info', 'trace'].forEach((type) => {
        (win.console as any)[type] = (...msgs: any[]) => {
          runtimeLog(pathname, type, msgs);
        };
      });
    }
  } catch (e) {
    renderCatchError(results, e);
  }
}

function runtimeLog(pathname: string, type: string, msgs: any[]) {
  (global.console as any)[type].apply(global.console, [`[ ${pathname}  ${type} ] `, ...msgs]);
}
