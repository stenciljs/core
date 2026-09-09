import { isAbsolute } from 'node:path';
import type * as d from '@stencil/core';

import {
  SSR,
  isBoolean,
  isOutputTargetLoaderBundle,
  isOutputTargetSsr,
  isOutputTargetWww,
  isString,
  join,
} from '../../../utils';

/**
 * Validate the SSR (server-side rendering) output targets.
 *
 * This output target generates a script for server-side rendering and hydration,
 * used for both SSR and static site generation (prerendering).
 *
 * If no explicit SSR output target is defined but prerendering or SSR is enabled,
 * this validator will auto-create one.
 *
 * @param config the Stencil configuration
 * @param userOutputs the output targets specified by the user
 * @returns the validated SSR output targets
 */
export const validateSsr = (config: d.ValidatedConfig, userOutputs: d.OutputTarget[]) => {
  const output: d.OutputTargetSsr[] = [];

  const hasSsrOutputTarget = userOutputs.some(isOutputTargetSsr);

  if (!hasSsrOutputTarget) {
    // We don't already have an SSR output target
    // Let's check if we need one based on other output targets

    const hasWwwOutput = userOutputs.filter(isOutputTargetWww).some((o) => isString(o.indexHtml));
    const shouldBuildSsr = config.prerender || config.ssr;

    if (hasWwwOutput && shouldBuildSsr) {
      // We're prerendering a www output target, so we'll need an SSR script
      let ssrDir: string;
      const loaderBundleOutput = userOutputs.find(isOutputTargetLoaderBundle);
      if (loaderBundleOutput != null && isString(loaderBundleOutput.dir)) {
        ssrDir = join(loaderBundleOutput.dir, 'ssr');
      } else {
        ssrDir = 'dist/ssr';
      }

      const ssrForWwwOutputTarget: d.OutputTargetSsr = {
        type: SSR,
        dir: ssrDir,
      };
      userOutputs.push(ssrForWwwOutputTarget);
    }
  }

  const ssrOutputTargets = userOutputs.filter(isOutputTargetSsr);

  ssrOutputTargets.forEach((outputTarget) => {
    if (!isString(outputTarget.dir)) {
      // No directory given, use default
      outputTarget.dir = 'dist/ssr';
    }

    if (!isAbsolute(outputTarget.dir)) {
      outputTarget.dir = join(config.rootDir, outputTarget.dir);
    }

    if (!isBoolean(outputTarget.empty)) {
      outputTarget.empty = true;
    }

    if (!isBoolean(outputTarget.minify)) {
      outputTarget.minify = false;
    }

    if (!isBoolean(outputTarget.cjs)) {
      outputTarget.cjs = false;
    }

    outputTarget.external = outputTarget.external || [];

    // Common Node.js built-ins that should remain external
    outputTarget.external.push('fs');
    outputTarget.external.push('path');
    outputTarget.external.push('crypto');

    // SSR skips in dev by default, unless devServer.ssr is enabled
    if (!isBoolean(outputTarget.skipInDev)) {
      outputTarget.skipInDev = !config.devServer?.ssr;
    }

    output.push(outputTarget);
  });

  return output;
};
