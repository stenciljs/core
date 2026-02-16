import { byteSize, isOutputTargetStats, result, sortBy } from '@utils';

import type * as d from '../../declarations';

/**
 * Generates the Build Stats from the buildCtx. Writes any files to the file system.
 * @param config the project build configuration
 * @param buildCtx An instance of the build which holds the details about the build
 * @returns CompilerBuildStats or an Object including diagnostics.
 */
export function generateBuildStats(
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
): result.Result<d.CompilerBuildStats, { diagnostics: d.Diagnostic[] }> {
  // TODO(STENCIL-461): Investigate making this return only a single type
  const buildResults = buildCtx.buildResults;

  try {
    if (buildResults.hasError) {
      return result.err({
        diagnostics: buildResults.diagnostics,
      });
    } else {
      const stats: d.CompilerBuildStats = {
        timestamp: buildResults.timestamp,
        compiler: {
          name: config.sys.name,
          version: config.sys.version,
        },
        app: {
          namespace: config.namespace,
          fsNamespace: config.fsNamespace,
          components: Object.keys(buildResults.componentGraph ?? {}).length,
          entries: Object.keys(buildResults.componentGraph ?? {}).length,
          bundles: buildResults.outputs.reduce((total, en) => total + en.files.length, 0),
          outputs: getAppOutputs(config, buildResults),
        },
        options: {
          minifyJs: !!config.minifyJs,
          minifyCss: !!config.minifyCss,
          hashFileNames: !!config.hashFileNames,
          hashedFileNameLength: config.hashedFileNameLength,
          buildEs5: !!config.buildEs5,
        },
        formats: {
          esmBrowser: sanitizeBundlesForStats(buildCtx.esmBrowserComponentBundle),
          esm: sanitizeBundlesForStats(buildCtx.esmComponentBundle),
          es5: sanitizeBundlesForStats(buildCtx.es5ComponentBundle),
          system: sanitizeBundlesForStats(buildCtx.systemComponentBundle),
          commonjs: sanitizeBundlesForStats(buildCtx.commonJsComponentBundle),
        },
        components: getComponentsFileMap(config, buildCtx),
        entries: buildCtx.entryModules,
        componentGraph: buildResults.componentGraph ?? {},
        sourceGraph: getSourceGraph(config, buildCtx),
        rollupResults: buildCtx.rollupResults ?? { modules: [] },
        collections: getCollections(config, buildCtx),
      };
      return result.ok(stats);
    }
  } catch (e: unknown) {
    const diagnostic: d.Diagnostic = {
      level: `error`,
      lines: [],
      messageText: `Generate Build Stats Error: ` + e,
      type: `build`,
    };
    return result.err({
      diagnostics: [diagnostic],
    });
  }
}

/**
 * Writes the files from the stats config to the file system
 * @param config the project build configuration
 * @param data the information to write out to disk (as specified by each stats output target specified in the provided
 * config)
 */
export async function writeBuildStats(
  config: d.ValidatedConfig,
  data: result.Result<d.CompilerBuildStats, { diagnostics: d.Diagnostic[] }>,
): Promise<void> {
  const statsTargets = config.outputTargets.filter(isOutputTargetStats);

  await result.map(data, async (compilerBuildStats) => {
    await Promise.all(
      statsTargets.map(async (outputTarget) => {
        if (outputTarget.file) {
          const result = await config.sys.writeFile(outputTarget.file, JSON.stringify(compilerBuildStats, null, 2));

          if (result.error) {
            config.logger.warn([`Stats failed to write file to ${outputTarget.file}`]);
          }
        }
      }),
    );
  });
}

function sanitizeBundlesForStats(bundleArray: ReadonlyArray<d.BundleModule>): ReadonlyArray<d.CompilerBuildStatBundle> {
  if (!bundleArray) {
    return [];
  }

  return bundleArray.map((bundle) => {
    return {
      key: bundle.entryKey,
      components: bundle.cmps.map((c) => c.tagName),
      bundleId: bundle.output.bundleId,
      fileName: bundle.output.fileName,
      imports: bundle.rollupResult.imports,
      // code: bundle.rollupResult.code, // (use this to debug)
      // Currently, this number is inaccurate vs what seems to be on disk.
      originalByteSize: byteSize(bundle.rollupResult.code),
    };
  });
}

function getSourceGraph(config: d.ValidatedConfig, buildCtx: d.BuildCtx) {
  const sourceGraph: d.BuildSourceGraph = {};

  sortBy(buildCtx.moduleFiles, (m) => m.sourceFilePath).forEach((moduleFile) => {
    const key = relativePath(config, moduleFile.sourceFilePath);
    sourceGraph[key] = moduleFile.localImports.map((localImport) => relativePath(config, localImport)).sort();
  });

  return sourceGraph;
}

function getAppOutputs(config: d.ValidatedConfig, buildResults: d.CompilerBuildResults) {
  return buildResults.outputs.map((output) => {
    return {
      name: output.type,
      files: output.files.length,
      generatedFiles: output.files.map((file) => relativePath(config, file)),
    };
  });
}

function getComponentsFileMap(config: d.ValidatedConfig, buildCtx: d.BuildCtx) {
  return buildCtx.components.map((component) => {
    return {
      tag: component.tagName,
      path: relativePath(config, component.jsFilePath),
      source: relativePath(config, component.sourceFilePath),
      elementRef: component.elementRef,
      componentClassName: component.componentClassName,
      assetsDirs: component.assetsDirs,
      dependencies: component.dependencies,
      dependents: component.dependents,
      directDependencies: component.directDependencies,
      directDependents: component.directDependents,
      docs: component.docs,
      encapsulation: component.encapsulation,
      excludeFromCollection: component.excludeFromCollection,
      events: component.events,
      internal: component.internal,
      listeners: component.listeners,
      methods: component.methods,
      potentialCmpRefs: component.potentialCmpRefs,
      properties: component.properties,
      shadowDelegatesFocus: component.shadowDelegatesFocus,
      states: component.states,
    };
  });
}

function getCollections(config: d.ValidatedConfig, buildCtx: d.BuildCtx): d.CompilerBuildStatCollection[] {
  return buildCtx.collections
    .map((c) => {
      return {
        name: c.collectionName,
        source: relativePath(config, c.moduleDir),
        tags: c.moduleFiles.map((m) => m.cmps.map((cmp: d.ComponentCompilerMeta) => cmp.tagName)).sort(),
      };
    })
    .sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
}

function relativePath(config: d.ValidatedConfig, file: string) {
  return config.sys.normalizePath(config.sys.platformPath.relative(config.rootDir, file));
}
