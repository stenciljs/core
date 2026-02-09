import {
  isOutputTargetDocsCustom,
  isOutputTargetDocsCustomElementsManifest,
  isOutputTargetDocsJson,
  isOutputTargetDocsReadme,
  isOutputTargetDocsVscode,
  join,
  normalizePath,
} from '../../utils';

import type * as d from '../../declarations';
import { generateCustomDocs } from '../docs/custom';
import { generateCustomElementsManifestDocs } from '../docs/cem';
import { generateDocData } from '../docs/generate-doc-data';
import { generateJsonDocs } from '../docs/json';
import { generateReadmeDocs } from '../docs/readme';
import { extractExistingCssProps } from '../docs/readme/output-docs';
import { generateVscodeDocs } from '../docs/vscode';

/**
 * Generate documentation-related output targets
 * @param config the configuration associated with the current Stencil task run
 * @param compilerCtx the current compiler context
 * @param buildCtx the build context for the current Stencil task run
 */
export const outputDocs = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  if (!config.buildDocs) {
    return;
  }
  const docsOutputTargets = config.outputTargets.filter(
    (o) =>
      isOutputTargetDocsReadme(o) ||
      isOutputTargetDocsJson(o) ||
      isOutputTargetDocsCustom(o) ||
      isOutputTargetDocsVscode(o) ||
      isOutputTargetDocsCustomElementsManifest(o),
  );

  if (docsOutputTargets.length === 0) {
    return;
  }

  // ensure all the styles are built first, which parses all the css docs
  await buildCtx.stylesPromise;

  const docsData = await generateDocData(config, compilerCtx, buildCtx);

  // If we're in docs-only mode (not a full build), preserve CSS Custom Properties
  // from existing README files for components with empty styles.
  // We detect docs-only mode by checking if ALL output targets are docs targets.
  const isDocsOnlyMode = config.outputTargets.every(
    (target) =>
      target.type === 'docs-readme' ||
      target.type === 'docs-json' ||
      target.type === 'docs-custom' ||
      target.type === 'docs-vscode' ||
      target.type === 'docs-custom-elements-manifest',
  );

  if (isDocsOnlyMode) {
    // Preserve CSS props for components with empty styles
    await Promise.all(
      docsData.components.map(async (component) => {
        if (component.styles.length === 0) {
          // Find the README output target to get the correct path
          const readmeTarget = docsOutputTargets.find(isOutputTargetDocsReadme) as d.OutputTargetDocsReadme | undefined;
          const readmeDir = readmeTarget?.dir || config.srcDir;
          const readmePath =
            normalizePath(readmeDir) === normalizePath(config.srcDir)
              ? component.readmePath
              : join(readmeDir, component.readmePath.replace(config.srcDir, ''));

          const existingCssProps = await extractExistingCssProps(compilerCtx, readmePath);
          if (existingCssProps) {
            // Update component styles with preserved props
            component.styles = existingCssProps;
          }
        }
      }),
    );
  }

  await Promise.all([
    generateReadmeDocs(config, compilerCtx, docsData, docsOutputTargets),
    generateJsonDocs(config, compilerCtx, docsData, docsOutputTargets),
    generateVscodeDocs(compilerCtx, docsData, docsOutputTargets),
    generateCustomDocs(config, docsData, docsOutputTargets),
    generateCustomElementsManifestDocs(compilerCtx, docsData, docsOutputTargets),
  ]);
};
