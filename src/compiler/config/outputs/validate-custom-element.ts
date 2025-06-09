import { COPY, DIST_TYPES, isBoolean, isOutputTargetDistCustomElements, join } from '@utils';

import type {
  OutputTarget,
  OutputTargetCopy,
  OutputTargetDistCustomElements,
  OutputTargetDistTypes,
  ValidatedConfig,
} from '../../../declarations';
import { CustomElementsExportBehaviorOptions } from '../../../declarations';
import { getAbsolutePath } from '../config-utils';
import { validateCopy } from '../validate-copy';

/**
 * Validate one or more `dist-custom-elements` output targets. Validation of an output target may involve back-filling
 * fields that are omitted with sensible defaults and/or creating additional supporting output targets that were not
 * explicitly defined by the user
 * @param config the Stencil configuration associated with the project being compiled
 * @param userOutputs the output target(s) specified by the user
 * @returns the validated output target(s)
 */
export const validateCustomElement = (
  config: ValidatedConfig,
  userOutputs: ReadonlyArray<OutputTarget>,
): ReadonlyArray<OutputTargetDistCustomElements | OutputTargetDistTypes | OutputTargetCopy> => {
  const defaultDir = 'dist';

  return userOutputs.filter(isOutputTargetDistCustomElements).reduce(
    (outputs, o) => {
      const outputTarget = {
        ...o,
        dir: getAbsolutePath(config, o.dir || join(defaultDir, 'components')),
      };
      if (!isBoolean(outputTarget.empty)) {
        outputTarget.empty = true;
      }
      if (!isBoolean(outputTarget.externalRuntime)) {
        outputTarget.externalRuntime = true;
      }
      if (!isBoolean(outputTarget.generateTypeDeclarations)) {
        outputTarget.generateTypeDeclarations = true;
      }
      // Export behavior must be defined on the validated target config and must
      // be one of the export behavior valid values
      if (
        outputTarget.customElementsExportBehavior == null ||
        !CustomElementsExportBehaviorOptions.includes(outputTarget.customElementsExportBehavior)
      ) {
        outputTarget.customElementsExportBehavior = 'default';
      }

      // unlike other output targets, Stencil does not allow users to define the output location of types at this time
      if (outputTarget.generateTypeDeclarations) {
        const typesDirectory = getAbsolutePath(config, join(defaultDir, 'types'));
        outputs.push({
          type: DIST_TYPES,
          dir: outputTarget.dir,
          typesDir: typesDirectory,
        });
      }

      outputTarget.copy = validateCopy(outputTarget.copy, []);

      if (outputTarget.copy.length > 0) {
        outputs.push({
          type: COPY,
          dir: config.rootDir,
          copy: [...outputTarget.copy],
        });
      }
      outputs.push(outputTarget);

      return outputs;
    },
    [] as (OutputTargetDistCustomElements | OutputTargetCopy | OutputTargetDistTypes)[],
  );
};
