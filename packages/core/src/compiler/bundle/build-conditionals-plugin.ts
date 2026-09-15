import MagicString from 'magic-string';
import type * as d from '@stencil/core';
import type { Plugin } from 'rolldown';

import { getBuildConditionalsLiterals } from './app-data-plugin';
import { getStencilInternalModule, getStencilInternalModuleFilter } from './core-resolve-plugin';

// `BUILD` may be renamed with a `$<n>` suffix (e.g. `BUILD$1`) when rolldown disambiguates a collision
const BUILD_FLAG_RE = /\bBUILD(?:\$\d+)?\.([A-Za-z_$][\w$]*)\b/g;

/**
 * Scoped by `id` to Stencil's own resolved internal runtime module(s) only
 * and only when the `jsMinifier` = `oxc`.
 *
 * Replaces `BUILD.<flag>` reads with their literal values, so a minifier's basic literal-boolean
 * folding (e.g. `false && x` -> nothing) can eliminate the resulting dead branches.
 * Oxc cannot dead-code-eliminate using `BUILD.<flag>` reads directly.
 *
 * @param config the Stencil configuration for the project
 * @param buildConditionals the build conditionals for this build
 * @returns a rolldown plugin, or null if this build doesn't need it
 */
export const buildConditionalsPlugin = (
  config: d.ValidatedConfig,
  buildConditionals: d.BuildConditionals | undefined,
): Plugin | null => {
  if (config.jsMinifier !== 'oxc' || !buildConditionals) {
    return null;
  }
  const literals = getBuildConditionalsLiterals(buildConditionals);
  if (literals.size === 0) {
    return null;
  }

  const compilerExe = config.sys.getCompilerExecutingPath();
  const internalClient = getStencilInternalModule(config, compilerExe, 'client/runtime.js');
  const internalSsr = getStencilInternalModule(config, compilerExe, 'server/index.mjs');
  const idFilter = getStencilInternalModuleFilter(internalClient, internalSsr);

  return {
    name: 'stencil-build-conditionals',
    transform: {
      filter: { id: idFilter, code: /\bBUILD(?:\$\d+)?\.\w/ },
      handler(code: string) {
        const s = new MagicString(code);
        let didReplace = false;
        for (const match of code.matchAll(BUILD_FLAG_RE)) {
          const literal = literals.get(match[1]);
          if (literal === undefined) {
            continue;
          }
          s.overwrite(match.index, match.index + match[0].length, literal);
          didReplace = true;
        }
        if (!didReplace) {
          return null;
        }
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        };
      },
    },
  };
};
