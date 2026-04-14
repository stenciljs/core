import type {
  OutputTarget,
  OutputTargetCopy,
  OutputTargetStandalone,
  ValidatedConfig,
} from '@stencil/core';

import { CustomElementsExportBehaviorOptions } from '../../../declarations/stencil-public-compiler';
import { COPY, isBoolean, isOutputTargetStandalone } from '../../../utils';
import { getAbsolutePath } from '../config-utils';
import { validateCopy } from '../validate-copy';

/**
 * Validate one or more `standalone` output targets.
 *
 * Validation may involve back-filling fields that are omitted with sensible defaults
 * and/or creating additional supporting output targets that were not explicitly
 * defined by the user (e.g., copy tasks).
 *
 * Note: In v5, type declarations are auto-generated as a separate `types` output target
 * in production builds, rather than being created here.
 *
 * @param config the Stencil configuration associated with the project being compiled
 * @param userOutputs the output target(s) specified by the user
 * @returns the validated output target(s)
 */
export const validateStandalone = (
  config: ValidatedConfig,
  userOutputs: ReadonlyArray<OutputTarget>,
): ReadonlyArray<OutputTargetStandalone | OutputTargetCopy> => {
  const defaultDir = 'dist/standalone';

  return userOutputs.filter(isOutputTargetStandalone).reduce(
    (outputs, o) => {
      const outputTarget = {
        ...o,
        dir: getAbsolutePath(config, o.dir || defaultDir),
        // standalone skips in dev by default
        skipInDev: isBoolean(o.skipInDev) ? o.skipInDev : true,
      };

      if (!isBoolean(outputTarget.empty)) {
        outputTarget.empty = true;
      }
      if (!isBoolean(outputTarget.externalRuntime)) {
        outputTarget.externalRuntime = true;
      }

      // Export behavior must be defined on the validated target config and must
      // be one of the export behavior valid values
      if (
        outputTarget.customElementsExportBehavior == null ||
        !CustomElementsExportBehaviorOptions.includes(outputTarget.customElementsExportBehavior)
      ) {
        outputTarget.customElementsExportBehavior = 'default';
      }

      // Normalize autoLoader option
      if (outputTarget.autoLoader === true) {
        outputTarget.autoLoader = {
          fileName: 'loader',
          autoStart: true,
        };
      } else if (outputTarget.autoLoader && typeof outputTarget.autoLoader === 'object') {
        outputTarget.autoLoader = {
          fileName: outputTarget.autoLoader.fileName || 'loader',
          autoStart: outputTarget.autoLoader.autoStart !== false,
        };
      }

      // Note: Type generation is now handled separately by auto-generated types output target in v5

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
    [] as (OutputTargetStandalone | OutputTargetCopy)[],
  );
};
