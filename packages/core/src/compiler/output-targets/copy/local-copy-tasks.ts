import { join } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../../declarations';

export const getSrcAbsPath = (config: d.ValidatedConfig, src: string) => {
  if (isAbsolute(src)) {
    return src;
  }
  return join(config.srcDir, src);
};

export const getDestAbsPath = (src: string, destAbsPath: string, destRelPath: string) => {
  if (destRelPath) {
    if (isAbsolute(destRelPath)) {
      return destRelPath;
    } else {
      return join(destAbsPath, destRelPath);
    }
  }

  if (isAbsolute(src)) {
    throw new Error(`copy task, "dest" property must exist if "src" property is an absolute path: ${src}`);
  }

  return destAbsPath;
};
