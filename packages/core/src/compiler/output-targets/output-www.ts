import { cloneDocument, serializeNodeToHtml } from '@stencil/mock-doc';
import type * as d from '@stencil/core';

import { catchError, flatOne, isOutputTargetWww, join, relative, unique } from '../../utils';
import { addScriptDataAttribute } from '../html/add-script-attr';
import { getAbsoluteBuildDir } from '../html/html-utils';
import { optimizeCriticalPath } from '../html/inject-module-preloads';
import { updateIndexHtmlServiceWorker } from '../html/inject-sw-script';
import { optimizeEsmImport } from '../html/inline-esm-import';
import { inlineStyleSheets } from '../html/inline-style-sheets';
import { updateGlobalStylesLink } from '../html/update-global-styles-link';
import { getUsedComponents } from '../html/used-components';
import { generateHashedCopy } from '../output-targets/copy/hashed-copy';
import { INDEX_ORG } from '../service-worker/generate-sw';
import { getScopeId } from '../style/scope-css';

/**
 * Run a {@link d.OutputTargetWww} build. This involves generating `index.html`
 * for the build which imports the output of the lazy build and also generating
 * a host configuration record.
 *
 * @param config the current user-supplied config
 * @param compilerCtx a compiler context
 * @param buildCtx a build context
 */
export const outputWww = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const outputTargets = config.outputTargets.filter(isOutputTargetWww);
  if (outputTargets.length === 0) {
    return;
  }

  const timespan = buildCtx.createTimeSpan(`generate www started`, true);
  const criticalBundles = getCriticalPath(buildCtx);

  await Promise.all(
    outputTargets.map((outputTarget) =>
      generateWww(config, compilerCtx, buildCtx, criticalBundles, outputTarget),
    ),
  );

  timespan.finish(`generate www finished`);
};

/**
 * Derive the 'critical path' for our HTML content, which is a list of the
 * bundles that it will need to render correctly.
 *
 * @param buildCtx the current build context
 * @returns a list of bundles that need to be pulled in
 */
const getCriticalPath = (buildCtx: d.BuildCtx) => {
  const componentGraph = buildCtx.componentGraph;
  if (!buildCtx.indexDoc || !componentGraph) {
    return [];
  }
  return unique(
    flatOne(
      getUsedComponents(buildCtx.indexDoc, buildCtx.components)
        .map((tagName) => getScopeId(tagName))
        .map((scopeId) => buildCtx.componentGraph.get(scopeId) || []),
    ),
  ).sort();
};

/**
 * Process a single www output target, generating an `index.html` file and a
 * host configuration record (and writing both to disk). Additional HTML files
 * found in srcDir are processed through the same optimization pipeline.
 *
 * @param config the current user-supplied config
 * @param compilerCtx a compiler context
 * @param buildCtx a build context
 * @param criticalPath a list of critical bundles
 * @param outputTarget the www output target of interest
 */
const generateWww = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  criticalPath: string[],
  outputTarget: d.OutputTargetWww,
): Promise<void> => {
  const skipHtml = compilerCtx.hasSuccessfulBuild && !buildCtx.hasHtmlChanges;

  // Compute hashed global styles filename once (prod only) so it can be
  // shared across all HTML files without re-hashing on each.
  let globalStylesFilename: string | undefined;
  if (!config.watch && !config.devMode) {
    globalStylesFilename = await generateHashedCopy(
      config,
      compilerCtx,
      join(outputTarget.buildDir, `${config.fsNamespace}.css`),
      outputTarget.hashedFileNameLength ?? 8,
    );
  }

  if (!skipHtml) {
    if (buildCtx.indexDoc && outputTarget.indexHtml) {
      await generateIndexHtml(
        config,
        compilerCtx,
        buildCtx,
        criticalPath,
        outputTarget,
        globalStylesFilename,
      );
    }

    for (const [relPath, doc] of buildCtx.htmlDocs) {
      const destPath = join(outputTarget.appDir, relPath);
      await generateHtmlFile(
        config,
        compilerCtx,
        buildCtx,
        doc,
        destPath,
        outputTarget,
        globalStylesFilename,
      );
    }
  }

  await generateHostConfig(compilerCtx, outputTarget);
};

/**
 * Generate a host configuration for a given www OT and write it to disk
 *
 * @param compilerCtx a compiler context
 * @param outputTarget a www OT
 * @returns a promise wrapping fs write results
 */
const generateHostConfig = (compilerCtx: d.CompilerCtx, outputTarget: d.OutputTargetWww) => {
  const buildDir = getAbsoluteBuildDir(outputTarget);
  const hostConfigPath = join(outputTarget.appDir, 'host.config.json');
  const hostConfigContent = JSON.stringify(
    {
      hosting: {
        headers: [
          {
            source: join(buildDir, '/p-*'),
            headers: [
              {
                key: 'Cache-Control',
                value: 'max-age=31556952, s-maxage=31556952, immutable',
              },
            ],
          },
        ],
      },
    },
    null,
    '  ',
  );

  return compilerCtx.fs.writeFile(hostConfigPath, hostConfigContent, {
    outputTargetType: outputTarget.type,
  });
};

/**
 * Process a single HTML document through the www optimization pipeline and
 * write the result to `destPath`. Used for both `index.html` (via
 * {@link generateIndexHtml}) and any additional HTML files found in srcDir.
 * @param config the current user-supplied config
 * @param compilerCtx a compiler context
 * @param buildCtx a build context
 * @param doc the HTML document to process
 * @param destPath the path to write the processed document to (relative to rootDir)
 * @param outputTarget the www output target of interest
 * @param globalStylesFilename the filename of the global styles (if applicable) so it can be inlined or linked appropriately
 * @param criticalPath a list of critical bundles to pull in (only applicable for index.html, but passed through for simplicity)
 */
const processHtmlDoc = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  doc: Document,
  destPath: string,
  outputTarget: d.OutputTargetWww,
  globalStylesFilename: string | undefined,
  criticalPath?: string[],
) => {
  addScriptDataAttribute(config, doc, outputTarget);
  await updateIndexHtmlServiceWorker(config, buildCtx, doc, outputTarget);

  if (!config.watch && !config.devMode) {
    const scriptFound = await optimizeEsmImport(config, compilerCtx, doc, outputTarget);
    await inlineStyleSheets(compilerCtx, doc, MAX_CSS_INLINE_SIZE, outputTarget);
    updateGlobalStylesLink(config, doc, globalStylesFilename, outputTarget);
    if (criticalPath && scriptFound && outputTarget.bundleMode !== 'standalone') {
      optimizeCriticalPath(doc, criticalPath, outputTarget);
    }
  }

  const content = serializeNodeToHtml(doc);
  await compilerCtx.fs.writeFile(destPath, content, { outputTargetType: outputTarget.type });
  buildCtx.debug(`generateHtmlFile, write: ${relative(config.rootDir, destPath)}`);
};

/**
 * Attempt to generate `index.html` content for a www output target and, if all
 * goes well, write it to disk.
 * @param config the current user-supplied config
 * @param compilerCtx a compiler context
 * @param buildCtx a build context
 * @param criticalPath a list of critical bundles to pull in
 * @param outputTarget the www output target of interest
 * @param globalStylesFilename the filename of the global styles (if applicable) so it can be inlined or linked appropriately
 */
const generateIndexHtml = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  criticalPath: string[],
  outputTarget: d.OutputTargetWww,
  globalStylesFilename: string | undefined,
) => {
  try {
    const doc = cloneDocument(buildCtx.indexDoc);
    await processHtmlDoc(
      config,
      compilerCtx,
      buildCtx,
      doc,
      outputTarget.indexHtml,
      outputTarget,
      globalStylesFilename,
      criticalPath,
    );

    if (outputTarget.serviceWorker && config.prerender) {
      const indexContent = serializeNodeToHtml(doc);
      await compilerCtx.fs.writeFile(join(outputTarget.appDir, INDEX_ORG), indexContent, {
        outputTargetType: outputTarget.type,
      });
    }
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }
};

/**
 * Process a non-entry HTML file through the www optimization pipeline (same as
 * index.html but without critical-path preload injection, which is
 * index-specific).
 * @param config the current user-supplied config
 * @param compilerCtx a compiler context
 * @param buildCtx a build context
 * @param doc the HTML document to process
 * @param destPath the path to write the processed document to (relative to rootDir)
 * @param outputTarget the www output target of interest
 * @param globalStylesFilename the filename of the global styles (if applicable) so it can be inlined or linked appropriately
 */
const generateHtmlFile = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  doc: Document,
  destPath: string,
  outputTarget: d.OutputTargetWww,
  globalStylesFilename: string | undefined,
) => {
  try {
    const cloned = cloneDocument(doc);
    await processHtmlDoc(
      config,
      compilerCtx,
      buildCtx,
      cloned,
      destPath,
      outputTarget,
      globalStylesFilename,
    );
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }
};

const MAX_CSS_INLINE_SIZE = 3 * 1024;
