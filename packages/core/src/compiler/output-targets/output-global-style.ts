import type * as d from '@stencil/core';

import {
  isOutputTargetGlobalStyle,
  isOutputTargetLoaderBundle,
  isOutputTargetWww,
  join,
} from '../../utils';
import { buildGlobalStyleFromInput } from '../style/global-styles';

/**
 * Output target generator for global styles.
 *
 * Builds and writes CSS for each global-style output target.
 * Each output target can have its own `input` file and `fileName`.
 *
 * Also handles backwards-compatible copies:
 * - If `copyToLoaderBrowser` is true (default), copies to the loader-bundle browser directory
 * - Copies to www build directories for dev server usage
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 */
export const outputGlobalStyle = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const globalStyleTargets = config.outputTargets.filter(isOutputTargetGlobalStyle);
  if (globalStyleTargets.length === 0) {
    return;
  }

  const timespan = buildCtx.createTimeSpan('generate global styles output started', true);

  // Get other output targets for compat copies
  const loaderBundleTargets = config.outputTargets.filter(isOutputTargetLoaderBundle);
  const wwwTargets = config.outputTargets.filter(isOutputTargetWww);
  const namespace = config.fsNamespace || 'app';

  await Promise.all(
    globalStyleTargets.map(async (outputTarget) => {
      // Skip if no input configured
      if (!outputTarget.input) {
        return;
      }

      // Build CSS for this input (uses cache if already built)
      const css = await buildGlobalStyleFromInput(
        config,
        compilerCtx,
        buildCtx,
        outputTarget.input,
      );

      if (!css) {
        return;
      }

      const writePromises: Promise<unknown>[] = [];

      // Write to the primary location (e.g., dist/assets/{fileName})
      const primaryPath = join(outputTarget.dir, outputTarget.fileName);
      writePromises.push(compilerCtx.fs.writeFile(primaryPath, css));

      // Handle copyToLoaderBrowser for backwards compatibility
      if (outputTarget.copyToLoaderBrowser && loaderBundleTargets.length > 0) {
        for (const loaderTarget of loaderBundleTargets) {
          // Copy to loader-bundle browser dir (e.g., dist/loader-bundle/{namespace}/{fileName})
          const browserDir = join(loaderTarget.buildDir, namespace);
          const compatPath = join(browserDir, outputTarget.fileName);
          writePromises.push(compilerCtx.fs.writeFile(compatPath, css));
        }
      }

      // Copy to www build directories for dev server
      for (const wwwTarget of wwwTargets) {
        const wwwPath = join(wwwTarget.buildDir, outputTarget.fileName);
        writePromises.push(compilerCtx.fs.writeFile(wwwPath, css));
      }

      await Promise.all(writePromises);
    }),
  );

  timespan.finish('generate global styles output finished');
};
