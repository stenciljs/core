import { buildError, buildWarn, flatOne, unique, validateComponentTag } from '@utils';

import type * as d from '../../declarations';
import { getUsedComponents } from '../html/used-components';

/**
 * Retrieve the component bundle groupings to be used when generating output
 * @param config the Stencil configuration used for the build
 * @param buildCtx the current build context
 * @param cmps the components that have been registered & defined for the current build
 * @returns the component bundling data
 */
export function getDefaultBundles(
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  cmps: d.ComponentCompilerMeta[],
): readonly d.ComponentCompilerMeta[][] {
  // get all of the user defined bundles in the Stencil config file
  const userConfigEntryPoints = getUserConfigBundles(config, buildCtx, cmps);
  if (userConfigEntryPoints.length > 0) {
    // prefer user defined entry points over anything else Stencil may derive
    return userConfigEntryPoints;
  }

  let entryPointsHints = config.entryComponentsHint;
  if (!entryPointsHints && buildCtx.indexDoc) {
    // attempt to scan an HTML file for known Stencil components
    entryPointsHints = getUsedComponents(buildCtx.indexDoc, cmps);
  }
  if (!entryPointsHints) {
    return [];
  }

  const mainBundle = unique([
    ...entryPointsHints,
    ...flatOne(entryPointsHints.map(resolveTag).map((cmp) => cmp.dependencies)),
  ]).map(resolveTag);

  function resolveTag(tag: string) {
    return cmps.find((cmp) => cmp.tagName === tag);
  }

  return [mainBundle];
}

/**
 * Retrieve and validate the `bundles` field on a project's Stencil configuration file
 * @param config the configuration file with a `bundles` field to inspect
 * @param buildCtx the current build context
 * @param cmps the components that have been registered & defined for the current build
 * @returns a three dimensional array with the compiler metadata for each component used
 */
export function getUserConfigBundles(
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  cmps: d.ComponentCompilerMeta[],
): readonly d.ComponentCompilerMeta[][] {
  const definedTags = new Set<string>();
  const entryTags = config.bundles.map((b: d.ConfigBundle) => {
    return b.components
      .map((tag: string) => {
        const tagError = validateComponentTag(tag);
        if (tagError) {
          const err = buildError(buildCtx.diagnostics);
          err.header = `Stencil Config`;
          err.messageText = tagError;
        }

        const component = cmps.find((cmp) => cmp.tagName === tag);
        if (!component) {
          const warn = buildWarn(buildCtx.diagnostics);
          warn.header = `Stencil Config`;
          warn.messageText = `Component tag "${tag}" is defined in a bundle but no matching component was found within this app or its collections.`;
        }

        if (definedTags.has(tag)) {
          const warn = buildWarn(buildCtx.diagnostics);
          warn.header = `Stencil Config`;
          warn.messageText = `Component tag "${tag}" has been defined multiple times in the "bundles" config.`;
        }

        definedTags.add(tag);
        return component;
      })
      .sort();
  });
  return entryTags;
}
