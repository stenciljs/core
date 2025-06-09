import * as d from '../../declarations';
import { UnvalidatedConfig } from '../../declarations';
import { isHexColor } from '../docs/readme/docs-util';
import { DEFAULT_TARGET_COMPONENT_STYLES } from './constants';

/**
 * Validate the `.docs` property on the supplied config object and
 * return a properly-validated value.
 *
 * @param config the configuration we're examining
 * @param logger the logger that will be set on the config
 * @returns a suitable/default value for the docs property
 */
export const validateDocs = (config: UnvalidatedConfig, logger: d.Logger): d.ValidatedConfig['docs'] => {
  const { background: defaultBackground, textColor: defaultTextColor } = DEFAULT_TARGET_COMPONENT_STYLES;

  let { background = defaultBackground, textColor = defaultTextColor } =
    config.docs?.markdown?.targetComponent ?? DEFAULT_TARGET_COMPONENT_STYLES;

  if (!isHexColor(background)) {
    logger.warn(
      `'${background}' is not a valid hex color. The default value for diagram backgrounds ('${defaultBackground}') will be used.`,
    );
    background = defaultBackground;
  }

  if (!isHexColor(textColor)) {
    logger.warn(
      `'${textColor}' is not a valid hex color. The default value for diagram text ('${defaultTextColor}') will be used.`,
    );
    textColor = defaultTextColor;
  }

  return {
    markdown: {
      targetComponent: {
        background,
        textColor,
      },
    },
  };
};
