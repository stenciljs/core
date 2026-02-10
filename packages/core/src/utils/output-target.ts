import { flatOne, sortBy } from './helpers';
import { isGlob } from './is-glob';
import { join, normalizePath } from './path';
import { minimatch } from 'minimatch';
import { basename, dirname, relative } from 'node:path';

import type * as d from '@stencil/core';
import {
  COPY,
  CUSTOM,
  DIST,
  DIST_COLLECTION,
  DIST_CUSTOM_ELEMENTS,
  DIST_GLOBAL_STYLES,
  DIST_HYDRATE_SCRIPT,
  DIST_LAZY,
  DIST_LAZY_LOADER,
  DIST_TYPES,
  DOCS_CUSTOM,
  DOCS_CUSTOM_ELEMENTS_MANIFEST,
  DOCS_JSON,
  DOCS_README,
  DOCS_VSCODE,
  GENERATED_DTS,
  STATS,
  VALID_CONFIG_OUTPUT_TARGETS,
  WWW,
} from './constants';

/**
 * Checks if a component tag name matches any of the exclude patterns.
 * Supports glob patterns using minimatch.
 *
 * @param tagName The component's tag name to check
 * @param excludePatterns Array of patterns to match against (supports globs)
 * @returns true if the component should be excluded, false otherwise
 */
export const shouldExcludeComponent = (tagName: string, excludePatterns: string[] | undefined): boolean => {
  if (!excludePatterns || excludePatterns.length === 0) {
    return false;
  }

  return excludePatterns.some((pattern) => {
    if (isGlob(pattern)) {
      return minimatch(tagName, pattern);
    }
    return pattern === tagName;
  });
};

export interface FilterComponentsResult {
  components: d.ComponentCompilerMeta[];
  excludedComponents: d.ComponentCompilerMeta[];
}

/**
 * Filters out components that match the excludeComponents patterns from the config.
 * Only applies filtering to production builds (when devMode is false) - dev builds include all components.
 *
 * @param components Array of component metadata
 * @param config The validated Stencil configuration
 * @returns Object containing filtered components and excluded components
 */
export const filterExcludedComponents = (
  components: d.ComponentCompilerMeta[],
  config: d.ValidatedConfig,
): FilterComponentsResult => {
  // Only apply exclusion logic in production builds (devMode === false)
  if (config.devMode) {
    return { components, excludedComponents: [] };
  }

  const excludePatterns = config.excludeComponents;

  if (!excludePatterns || excludePatterns.length === 0) {
    return { components, excludedComponents: [] };
  }

  const excludedComponents: d.ComponentCompilerMeta[] = [];
  const excludedTags: string[] = [];

  const filtered = components.filter((cmp) => {
    const shouldExclude = shouldExcludeComponent(cmp.tagName, excludePatterns);

    if (shouldExclude) {
      excludedComponents.push(cmp);
      excludedTags.push(cmp.tagName);
      config.logger.debug(`Excluding component from build: ${cmp.tagName}`);
    }

    return !shouldExclude;
  });

  // Log summary of excluded components for production builds
  if (excludedTags.length > 0) {
    const tagList = excludedTags.join(', ');
    config.logger.info(
      `Excluding ${excludedTags.length} component${excludedTags.length === 1 ? '' : 's'} from production build: ${tagList}`,
    );
  }

  return { components: filtered, excludedComponents };
};

export const relativeImport = (pathFrom: string, pathTo: string, ext?: string, addPrefix = true) => {
  let relativePath = relative(dirname(pathFrom), dirname(pathTo));
  if (addPrefix) {
    if (relativePath === '') {
      relativePath = '.';
    } else if (relativePath[0] !== '.') {
      relativePath = './' + relativePath;
    }
  }
  return normalizePath(`${relativePath}/${basename(pathTo, ext)}`);
};

export const getComponentsDtsSrcFilePath = (config: d.ValidatedConfig) => join(config.srcDir, GENERATED_DTS);

/**
 * Helper to get an appropriate file path for `components.d.ts` for a `"dist"`
 * or `"dist-types"` output target.
 *
 * @param outputTarget the output target of interest
 * @returns a properly-formatted path
 */
export const getComponentsDtsTypesFilePath = (outputTarget: Required<d.OutputTargetDist> | d.OutputTargetDistTypes) =>
  join(outputTarget.typesDir, GENERATED_DTS);

export const isOutputTargetDist = (o: d.OutputTarget): o is d.OutputTargetDist => o.type === DIST;

export const isOutputTargetDistCollection = (o: d.OutputTarget): o is d.OutputTargetDistCollection =>
  o.type === DIST_COLLECTION;

export const isOutputTargetDistCustomElements = (o: d.OutputTarget): o is d.OutputTargetDistCustomElements =>
  o.type === DIST_CUSTOM_ELEMENTS;

export const isOutputTargetCopy = (o: d.OutputTarget): o is d.OutputTargetCopy => o.type === COPY;

export const isOutputTargetDistLazy = (o: d.OutputTarget): o is d.OutputTargetDistLazy => o.type === DIST_LAZY;

export const isOutputTargetDistLazyLoader = (o: d.OutputTarget): o is d.OutputTargetDistLazyLoader =>
  o.type === DIST_LAZY_LOADER;

export const isOutputTargetDistGlobalStyles = (o: d.OutputTarget): o is d.OutputTargetDistGlobalStyles =>
  o.type === DIST_GLOBAL_STYLES;

export const isOutputTargetHydrate = (o: d.OutputTarget): o is d.OutputTargetHydrate => o.type === DIST_HYDRATE_SCRIPT;

export const isOutputTargetCustom = (o: d.OutputTarget): o is d.OutputTargetCustom => o.type === CUSTOM;

export const isOutputTargetDocs = (
  o: d.OutputTarget,
): o is
  | d.OutputTargetDocsJson
  | d.OutputTargetDocsReadme
  | d.OutputTargetDocsVscode
  | d.OutputTargetDocsCustom
  | d.OutputTargetDocsCustomElementsManifest =>
  o.type === DOCS_README ||
  o.type === DOCS_JSON ||
  o.type === DOCS_CUSTOM ||
  o.type === DOCS_VSCODE ||
  o.type === DOCS_CUSTOM_ELEMENTS_MANIFEST;

export const isOutputTargetDocsReadme = (o: d.OutputTarget): o is d.OutputTargetDocsReadme => o.type === DOCS_README;

export const isOutputTargetDocsJson = (o: d.OutputTarget): o is d.OutputTargetDocsJson => o.type === DOCS_JSON;

export const isOutputTargetDocsCustom = (o: d.OutputTarget): o is d.OutputTargetDocsCustom => o.type === DOCS_CUSTOM;

export const isOutputTargetDocsVscode = (o: d.OutputTarget): o is d.OutputTargetDocsVscode => o.type === DOCS_VSCODE;

export const isOutputTargetDocsCustomElementsManifest = (
  o: d.OutputTarget,
): o is d.OutputTargetDocsCustomElementsManifest => o.type === DOCS_CUSTOM_ELEMENTS_MANIFEST;

export const isOutputTargetWww = (o: d.OutputTarget): o is d.OutputTargetWww => o.type === WWW;

export const isOutputTargetStats = (o: d.OutputTarget): o is d.OutputTargetStats => o.type === STATS;

export const isOutputTargetDistTypes = (o: d.OutputTarget): o is d.OutputTargetDistTypes => o.type === DIST_TYPES;

/**
 * Checks whether or not the supplied output target's type matches one of the eligible primary
 * package output target types (i.e. it can have `isPrimaryPackageOutputTarget: true` in its config).
 *
 * @param o The output target to check.
 * @returns Whether the output target type is one of the "primary" output targets.
 */
export const isEligiblePrimaryPackageOutputTarget = (o: d.OutputTarget): o is d.EligiblePrimaryPackageOutputTarget =>
  isOutputTargetDist(o) ||
  isOutputTargetDistCollection(o) ||
  isOutputTargetDistCustomElements(o) ||
  isOutputTargetDistTypes(o);

/**
 * Retrieve the Stencil component compiler metadata from a collection of Stencil {@link d.Module}s
 * @param moduleFiles the collection of `Module`s to retrieve the metadata from
 * @returns the metadata, lexicographically sorted by the tag names of the components
 */
export const getComponentsFromModules = (moduleFiles: d.Module[]): d.ComponentCompilerMeta[] =>
  sortBy(flatOne(moduleFiles.map((m) => m.cmps)), (c: d.ComponentCompilerMeta) => c.tagName);

// Given a ReadonlyArray of strings we can derive a union type from them
// by getting `typeof ARRAY[number]`, i.e. the type of all values returns
// by number keys.
type ValidConfigOutputTarget = (typeof VALID_CONFIG_OUTPUT_TARGETS)[number];

/**
 * Check whether a given output target is a valid one to be set in a Stencil config
 *
 * @param targetType the type which we want to check
 * @returns whether or not the targetType is a valid, configurable output target.
 */
export function isValidConfigOutputTarget(targetType: string): targetType is ValidConfigOutputTarget {
  // unfortunately `includes` is typed on `ReadonlyArray<T>` as `(el: T):
  // boolean` so a `string` cannot be passed to `includes` on a
  // `ReadonlyArray` 😢 thus we `as any`
  //
  // see microsoft/TypeScript#31018 for some discussion of this
  return VALID_CONFIG_OUTPUT_TARGETS.includes(targetType as any);
}
