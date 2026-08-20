import { resolve } from 'node:path';
import { createJiti } from 'jiti';
import type { Diagnostic } from '@stencil/core';

import { catchError } from '../../utils';

/**
 * Load a module using jiti with TypeScript and ESM support.
 *
 * @param id - the module path to require
 * @returns an object containing the loaded module, resolved ID, and any diagnostics
 */
export const nodeRequire = async (id: string) => {
  const results = {
    module: undefined as any,
    id,
    diagnostics: [] as Diagnostic[],
  };

  try {
    results.id = resolve(id);
    // Fresh instance per call so config reloads always get the updated file
    const jiti = createJiti(import.meta.url);
    results.module = await jiti.import(results.id);
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
};
