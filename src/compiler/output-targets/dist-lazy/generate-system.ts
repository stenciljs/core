import { generatePreamble, join, relativeImport } from '@utils';
import type { OutputOptions, RollupBuild } from 'rollup';

import type * as d from '../../../declarations';
import { getAppBrowserCorePolyfills } from '../../app-core/app-polyfills';
import { generateRollupOutput } from '../../app-core/bundle-app-core';
import { generateLazyModules } from './generate-lazy-module';
import { lazyBundleIdPlugin } from './lazy-bundleid-plugin';

export const generateSystem = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupBuild: RollupBuild,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<d.UpdatedLazyBuildCtx> => {
  const systemOutputs = outputTargets.filter((o) => !!o.systemDir);

  if (systemOutputs.length > 0) {
    const esmOpts: OutputOptions = {
      banner: generatePreamble(config),
      format: 'system',
      entryFileNames: config.hashFileNames ? 'p-[hash].system.js' : '[name].system.js',
      chunkFileNames: config.hashFileNames ? 'p-[hash].system.js' : '[name]-[hash].system.js',
      assetFileNames: config.hashFileNames ? 'p-[hash][extname]' : '[name]-[hash][extname]',
      sourcemap: config.sourceMap,
      plugins: [lazyBundleIdPlugin(buildCtx, config, config.hashFileNames, '.system')],
    };
    const results = await generateRollupOutput(rollupBuild, esmOpts, config, buildCtx.entryModules);
    if (results != null) {
      const destinations = systemOutputs
        .map((o) => o.esmDir)
        .filter((esmDir): esmDir is string => typeof esmDir === 'string');
      buildCtx.systemComponentBundle = await generateLazyModules(
        config,
        compilerCtx,
        buildCtx,
        outputTargets[0].type,
        destinations,
        results,
        'es5',
        true,
      );

      await generateSystemLoaders(config, compilerCtx, results, systemOutputs);
    }
  }

  return { name: 'system', buildCtx };
};

const generateSystemLoaders = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  rollupResult: d.RollupResult[],
  systemOutputs: d.OutputTargetDistLazy[],
): Promise<void[]> => {
  const loaderFilename = rollupResult.find((r) => r.type === 'chunk' && r.isBrowserLoader).fileName;

  return Promise.all(systemOutputs.map((o) => writeSystemLoader(config, compilerCtx, loaderFilename, o)));
};

const writeSystemLoader = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  loaderFilename: string,
  outputTarget: d.OutputTargetDistLazy,
): Promise<void> => {
  if (outputTarget.systemLoaderFile) {
    const entryPointPath = join(outputTarget.systemDir, loaderFilename);
    const relativePath = relativeImport(outputTarget.systemLoaderFile, entryPointPath);
    const loaderContent = await getSystemLoader(config, compilerCtx, relativePath, !!outputTarget.polyfills);
    await compilerCtx.fs.writeFile(outputTarget.systemLoaderFile, loaderContent, {
      outputTargetType: outputTarget.type,
    });
  }
};

const getSystemLoader = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  corePath: string,
  includePolyfills: boolean,
): Promise<string> => {
  const polyfills = includePolyfills
    ? await getAppBrowserCorePolyfills(config, compilerCtx)
    : '/* polyfills excluded */';
  return `
'use strict';
(function () {
  var currentScript = document.currentScript;

  // Safari 10 support type="module" but still download and executes the nomodule script
  if (!currentScript || !currentScript.hasAttribute('nomodule') || !('onbeforeload' in currentScript)) {

    ${polyfills}

    // Figure out currentScript (for IE11, since it does not support currentScript)
    var regex = /\\/${config.fsNamespace}(\\.esm)?\\.js($|\\?|#)/;
    var scriptElm = currentScript || Array.from(document.querySelectorAll('script')).find(function(s) {
      return regex.test(s.src) || s.getAttribute('data-stencil-namespace') === "${config.fsNamespace}";
    });

    var resourcesUrl = scriptElm ? scriptElm.getAttribute('data-resources-url') || scriptElm.src : '';
    var start = function() {
      // if src is not present then origin is "null", and new URL() throws TypeError: Failed to construct 'URL': Invalid base URL
      var url = new URL('${corePath}', new URL(resourcesUrl, window.location.origin !== 'null' ? window.location.origin : undefined));
      System.import(url.href);
    };

    start();

    // Note: using .call(window) here because the self-executing function needs
    // to be scoped to the window object for the ES6Promise polyfill to work
  }
}).call(window);
`;
};
