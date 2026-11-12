import type * as d from '@stencil/core';

import {
  filterActiveTargets,
  isOutputTargetDocsAgentSkill,
  isOutputTargetDocsCustom,
  isOutputTargetDocsCustomElementsManifest,
  isOutputTargetDocsJson,
  isOutputTargetDocsReadme,
  isOutputTargetDocsVscode,
} from '../../utils';
import { generateAgentSkillDocs } from '../docs/agent-skill';
import { generateCustomElementsManifestDocs } from '../docs/cem';
import { collectStyleDocs } from '../docs/collect-style-docs';
import { generateCustomDocs } from '../docs/custom';
import { generateDocData } from '../docs/generate-doc-data';
import { generateJsonDocs } from '../docs/json';
import { generateReadmeDocs } from '../docs/readme';
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
  // Filter docs targets based on skipInDev setting
  const docsOutputTargets = filterActiveTargets(
    config.outputTargets.filter(
      (o) =>
        isOutputTargetDocsReadme(o) ||
        isOutputTargetDocsJson(o) ||
        isOutputTargetDocsCustom(o) ||
        isOutputTargetDocsVscode(o) ||
        isOutputTargetDocsCustomElementsManifest(o) ||
        isOutputTargetDocsAgentSkill(o),
    ),
    config.devMode,
  );

  if (docsOutputTargets.length === 0) {
    return;
  }

  // ensure all the styles are built first, which parses all the css docs
  await buildCtx.stylesPromise;
  await collectStyleDocs(config, compilerCtx, buildCtx);

  const docsData = await generateDocData(config, compilerCtx, buildCtx);

  await Promise.all([
    generateReadmeDocs(config, compilerCtx, docsData, docsOutputTargets),
    generateJsonDocs(config, compilerCtx, docsData, docsOutputTargets),
    generateVscodeDocs(compilerCtx, docsData, docsOutputTargets),
    generateCustomDocs(config, docsData, docsOutputTargets),
    generateCustomElementsManifestDocs(config, compilerCtx, docsData, docsOutputTargets),
    generateAgentSkillDocs(compilerCtx, docsData, docsOutputTargets),
  ]);
};
