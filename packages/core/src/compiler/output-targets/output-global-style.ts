import type * as d from '@stencil/core';

import {
  isOutputTargetGlobalStyle,
  isOutputTargetLoaderBundle,
  isOutputTargetWww,
  join,
} from '../../utils';

/**
 * Output target generator for global styles.
 *
 * Writes the built global CSS to a unified location (default: `dist/assets/{namespace}.css`)
 * that all distribution strategies can access.
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

  // Get the built global styles - this was already built earlier in the build process
  // by generateGlobalStyles() and stored in compilerCtx.cachedGlobalStyle
  const globalStyles = compilerCtx.cachedGlobalStyle;
  if (!globalStyles) {
    return;
  }

  const timespan = buildCtx.createTimeSpan('generate global styles output started', true);

  const namespace = config.fsNamespace || 'app';
  const cssFileName = `${namespace}.css`;

  // Get other output targets for compat copies
  const loaderBundleTargets = config.outputTargets.filter(isOutputTargetLoaderBundle);
  const wwwTargets = config.outputTargets.filter(isOutputTargetWww);

  await Promise.all(
    globalStyleTargets.map(async (outputTarget) => {
      const writePromises: Promise<void>[] = [];

      // Write to the primary location (e.g., dist/assets/{namespace}.css)
      const primaryPath = join(outputTarget.dir, cssFileName);
      writePromises.push(compilerCtx.fs.writeFile(primaryPath, globalStyles));

      // Handle copyToLoaderBrowser for backwards compatibility
      if (outputTarget.copyToLoaderBrowser && loaderBundleTargets.length > 0) {
        for (const loaderTarget of loaderBundleTargets) {
          // Copy to loader-bundle browser dir (e.g., dist/loader-bundle/{namespace}/{namespace}.css)
          const browserDir = join(loaderTarget.buildDir, namespace);
          const compatPath = join(browserDir, cssFileName);
          writePromises.push(compilerCtx.fs.writeFile(compatPath, globalStyles));
        }
      }

      // Copy to www build directories for dev server
      for (const wwwTarget of wwwTargets) {
        const wwwPath = join(wwwTarget.buildDir, cssFileName);
        writePromises.push(compilerCtx.fs.writeFile(wwwPath, globalStyles));
      }

      await Promise.all(writePromises);
    }),
  );

  timespan.finish('generate global styles output finished');
};
