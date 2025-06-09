import { isOutputTargetDocsReadme } from '@utils';

import type * as d from '../../../declarations';
import { generateReadme } from './output-docs';

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

  await Promise.all(
    docsData.components.map((cmpData) => {
      return generateReadme(config, compilerCtx, readmeOutputTargets, cmpData, docsData.components);
    }),
  );
};

export const strictCheckDocs = (config: d.ValidatedConfig, docsData: d.JsonDocs) => {
  docsData.components.forEach((component) => {
    component.props.forEach((prop) => {
      if (!prop.docs && prop.deprecation === undefined) {
        config.logger.warn(`Property "${prop.name}" of "${component.tag}" is not documented. ${component.filePath}`);
      }
    });
    component.methods.forEach((method) => {
      if (!method.docs && method.deprecation === undefined) {
        config.logger.warn(`Method "${method.name}" of "${component.tag}" is not documented. ${component.filePath}`);
      }
    });
    component.events.forEach((ev) => {
      if (!ev.docs && ev.deprecation === undefined) {
        config.logger.warn(`Event "${ev.event}" of "${component.tag}" is not documented. ${component.filePath}`);
      }
    });
    component.parts.forEach((ev) => {
      if (ev.docs === '') {
        config.logger.warn(`Part "${ev.name}" of "${component.tag}" is not documented. ${component.filePath}`);
      }
    });
  });
};
