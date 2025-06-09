import { isOutputTargetDocsCustom } from '@utils';

import type * as d from '../../../declarations';

export const generateCustomDocs = async (
  config: d.ValidatedConfig,
  docsData: d.JsonDocs,
  outputTargets: d.OutputTarget[],
) => {
  const customOutputTargets = outputTargets.filter(isOutputTargetDocsCustom);
  if (customOutputTargets.length === 0) {
    return;
  }
  await Promise.all(
    customOutputTargets.map(async (customOutput) => {
      try {
        await customOutput.generator(docsData, config);
      } catch (e) {
        config.logger.error(`uncaught custom docs error: ${e}`);
      }
    }),
  );
};
