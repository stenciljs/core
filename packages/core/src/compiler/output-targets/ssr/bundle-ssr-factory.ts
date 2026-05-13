import * as ts from 'typescript';
import type * as d from '@stencil/core';

import { isRolldownError, loadRolldownDiagnostics } from '../../../utils';
import { bundleOutput } from '../../bundle/bundle-output';
import { STENCIL_INTERNAL_SSR_PLATFORM_ID } from '../../bundle/entry-alias-ids';
import { addTagTransform } from '../../transformers/add-tag-transform';
import { ssrComponentTransform } from '../../transformers/component-ssr/tranform-to-ssr-component';
import { removeCollectionImports } from '../../transformers/remove-collection-imports';
import { rewriteAliasedSourceFileImportPaths } from '../../transformers/rewrite-aliased-paths';
import { updateStencilCoreImports } from '../../transformers/update-stencil-core-import';
import { getSsrBuildConditionals } from './ssr-build-conditionals';
import type { BundleOptions } from '../../bundle/bundle-interface';

/**
 * Marshall some Rolldown options for the ssr factory and then pass it to our
 * {@link bundleOutput} helper
 *
 * @param config a validated Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param appFactoryEntryCode an entry code for the app factory
 * @returns a promise wrapping a rolldown build object
 */
export const bundleSsrFactory = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  appFactoryEntryCode: string,
) => {
  try {
    const bundleOpts: BundleOptions = {
      id: 'ssr',
      platform: 'ssr',
      conditionals: getSsrBuildConditionals(config, buildCtx.components),
      customBeforeTransformers: getCustomBeforeTransformers(config, compilerCtx, buildCtx),
      codeSplitting: false,
      inputs: {
        '@stencil/core/runtime/server/ssr-factory': '@stencil/core/runtime/server/ssr-factory',
      },
      loader: {
        '@stencil/core/runtime/server/ssr-factory': appFactoryEntryCode,
      },
    };

    const rolldownBuild = await bundleOutput(config, compilerCtx, buildCtx, bundleOpts);
    return rolldownBuild;
  } catch (e) {
    if (!buildCtx.hasError && isRolldownError(e)) {
      loadRolldownDiagnostics(config, compilerCtx, buildCtx, e);
    }
  }
  return undefined;
};

/**
 * Generate a collection of transformations that are to be applied as a part of the `before` step in the TypeScript
 * compilation process.
 *
 * @param config the Stencil configuration associated with the current build
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @returns a collection of transformations that should be applied to the source code, intended for the `before` part
 * of the pipeline
 */
const getCustomBeforeTransformers = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx?: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile>[] => {
  const transformOpts: d.TransformOptions = {
    coreImportPath: STENCIL_INTERNAL_SSR_PLATFORM_ID,
    componentExport: null,
    componentMetadata: null,
    currentDirectory: config.sys.getCurrentDirectory(),
    proxy: null,
    style: 'static',
    styleImportData: 'queryparams',
  };
  const customBeforeTransformers = [updateStencilCoreImports(transformOpts.coreImportPath)];

  if (config.transformAliasedImportPaths) {
    customBeforeTransformers.push(rewriteAliasedSourceFileImportPaths);
  }

  if (buildCtx.config.extras.additionalTagTransformers) {
    customBeforeTransformers.push(addTagTransform(compilerCtx, buildCtx));
  }

  customBeforeTransformers.push(
    ssrComponentTransform(compilerCtx, transformOpts, buildCtx),
    removeCollectionImports(compilerCtx),
  );
  return customBeforeTransformers;
};
