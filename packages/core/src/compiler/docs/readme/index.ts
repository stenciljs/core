import type * as d from '@stencil/core';

import { isOutputTargetDocsReadme } from '../../../utils';
import { generateMergedReadme, generateReadme } from './output-docs';

export const generateReadmeDocs = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  docsData: d.JsonDocs,
  outputTargets: d.OutputTarget[],
) => {
  const readmeOutputTargets = outputTargets.filter(isOutputTargetDocsReadme);
  if (readmeOutputTargets.length === 0) {
    return;
  }
  const strictCheck = readmeOutputTargets.some((o) => o.strict);
  if (strictCheck) {
    strictCheckDocs(config, docsData);
  }

  // Group components by their readme path — multiple components in the same
  // directory share a single readme.md and must be merged into one document.
  const byReadmePath = new Map<string, d.JsonDocsComponent[]>();
  for (const cmpData of docsData.components) {
    const group = byReadmePath.get(cmpData.readmePath);
    if (group) {
      group.push(cmpData);
    } else {
      byReadmePath.set(cmpData.readmePath, [cmpData]);
    }
  }

  await Promise.all(
    Array.from(byReadmePath.values()).map((group) =>
      group.length === 1
        ? generateReadme(config, compilerCtx, readmeOutputTargets, group[0], docsData.components)
        : generateMergedReadme(
            config,
            compilerCtx,
            readmeOutputTargets,
            group,
            docsData.components,
          ),
    ),
  );
};

const strictCheckDocs = (config: d.ValidatedConfig, docsData: d.JsonDocs) => {
  docsData.components.forEach((component) => {
    component.props.forEach((prop) => {
      if (!prop.docs && prop.deprecation === undefined) {
        config.logger.warn(
          `Property "${prop.name}" of "${component.tag}" is not documented. ${component.filePath}`,
        );
      }
    });
    component.methods.forEach((method) => {
      if (!method.docs && method.deprecation === undefined) {
        config.logger.warn(
          `Method "${method.name}" of "${component.tag}" is not documented. ${component.filePath}`,
        );
      }
    });
    component.events.forEach((ev) => {
      if (!ev.docs && ev.deprecation === undefined) {
        config.logger.warn(
          `Event "${ev.event}" of "${component.tag}" is not documented. ${component.filePath}`,
        );
      }
    });
    component.parts.forEach((ev) => {
      if (ev.docs === '') {
        config.logger.warn(
          `Part "${ev.name}" of "${component.tag}" is not documented. ${component.filePath}`,
        );
      }
    });
  });
};
