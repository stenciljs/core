import { cloneDocument, serializeNodeToHtml } from '@stencil/core/mock-doc';
import { catchError, flatOne, isOutputTargetWww, join, relative, unique } from '@utils';

import type * as d from '../../declarations';
import { generateEs5DisabledMessage } from '../app-core/app-es5-disabled';
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
    outputTargets.map((outputTarget) => generateWww(config, compilerCtx, buildCtx, criticalBundles, outputTarget)),
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
 * host config (and writing both to disk)
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
  if (!config.buildEs5) {
    await generateEs5DisabledMessage(config, compilerCtx, outputTarget);
  }

  // Copy global styles into the build directory
  // Process
  if (buildCtx.indexDoc && outputTarget.indexHtml) {
    await generateIndexHtml(config, compilerCtx, buildCtx, criticalPath, outputTarget);
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

  return compilerCtx.fs.writeFile(hostConfigPath, hostConfigContent, { outputTargetType: outputTarget.type });
};

/**
 * Attempt to generate `index.html` content for a www output target and, if all
 * goes well, write it to disk. As part of creating the content several
 * optimizations (mainly inlining content and adding module preloads) are
 * attempted.
 *
 * @param config the current user-supplied Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param criticalPath a list of bundles for which we should add module preloads
 * @param outputTarget the www output target of interest
 */
const generateIndexHtml = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  criticalPath: string[],
  outputTarget: d.OutputTargetWww,
) => {
  if (compilerCtx.hasSuccessfulBuild && !buildCtx.hasHtmlChanges) {
    // no need to rebuild index.html if there were no app file changes
    return;
  }

  // get the source index html content
  try {
    const doc = cloneDocument(buildCtx.indexDoc);
    addScriptDataAttribute(config, doc, outputTarget);

    // validateHtml(config, buildCtx, doc);
    await updateIndexHtmlServiceWorker(config, buildCtx, doc, outputTarget);
    if (!config.watch && !config.devMode) {
      const globalStylesFilename = await generateHashedCopy(
        config,
        compilerCtx,
        join(outputTarget.buildDir, `${config.fsNamespace}.css`),
      );
      const scriptFound = await optimizeEsmImport(config, compilerCtx, doc, outputTarget);
      await inlineStyleSheets(compilerCtx, doc, MAX_CSS_INLINE_SIZE, outputTarget);
      updateGlobalStylesLink(config, doc, globalStylesFilename, outputTarget);
      if (scriptFound) {
        optimizeCriticalPath(doc, criticalPath, outputTarget);
      }
    }

    const indexContent = serializeNodeToHtml(doc);
    await compilerCtx.fs.writeFile(outputTarget.indexHtml, indexContent, { outputTargetType: outputTarget.type });

    if (outputTarget.serviceWorker && config.flags.prerender) {
      await compilerCtx.fs.writeFile(join(outputTarget.appDir, INDEX_ORG), indexContent, {
        outputTargetType: outputTarget.type,
      });
    }

    buildCtx.debug(`generateIndexHtml, write: ${relative(config.rootDir, outputTarget.indexHtml)}`);
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }
};

const MAX_CSS_INLINE_SIZE = 3 * 1024;
