import { createJsVarName, normalizeFsPathQuery } from '@utils';
import { basename } from 'path';
import type { Plugin, TransformPluginContext, TransformResult } from 'rollup';

import type * as d from '../../declarations';

export const extFormatPlugin = (config: d.ValidatedConfig): Plugin => {
  return {
    name: 'extFormatPlugin',

    transform(code: string, importPath: string): TransformResult {
      if (/\0/.test(importPath)) {
        return null;
      }

      const { ext, filePath, format } = normalizeFsPathQuery(importPath);

      // ?format= param takes precedence before file extension
      switch (format) {
        case 'url':
          return { code: formatUrl(config, this, code, filePath, ext), map: null };
        case 'text':
          return { code: formatText(code, filePath), map: null };
      }

      // didn't provide a ?format= param
      // check if it's a known extension we should format
      if (ext != null && FORMAT_TEXT_EXTS.includes(ext)) {
        return { code: formatText(code, filePath), map: null };
      }

      if (ext != null && FORMAT_URL_MIME[ext]) {
        return { code: formatUrl(config, this, code, filePath, ext), map: null };
      }

      return null;
    },
  };
};

const FORMAT_TEXT_EXTS = ['txt', 'frag', 'vert'];

const FORMAT_URL_MIME: any = {
  svg: 'image/svg+xml',
};

const DATAURL_MAX_IMAGE_SIZE = 4 * 1024; // 4KiB

const formatText = (code: string, filePath: string) => {
  const varName = createJsVarName(basename(filePath));
  return `const ${varName} = ${JSON.stringify(code)};export default ${varName};`;
};

const formatUrl = (
  config: d.ValidatedConfig,
  pluginCtx: TransformPluginContext,
  code: string,
  filePath: string,
  ext: string | null,
) => {
  const mime = ext != null ? FORMAT_URL_MIME[ext] : null;
  if (!mime) {
    pluginCtx.warn(`Unsupported url format for "${ext}" extension.`);
    return formatText('', filePath);
  }

  const varName = createJsVarName(basename(filePath));
  const base64 = config.sys.encodeToBase64(code);
  if (config.devMode && base64.length > DATAURL_MAX_IMAGE_SIZE) {
    pluginCtx.warn(`Importing large files will bloat your bundle size, please use external assets instead.`);
  }

  return `const ${varName} = 'data:${mime};base64,${base64}';export default ${varName};`;
};
