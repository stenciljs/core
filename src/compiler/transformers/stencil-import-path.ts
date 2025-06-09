import { DEFAULT_STYLE_MODE, isString, relative } from '@utils';
import { basename, dirname, isAbsolute } from 'path';

import type { ImportData, ParsedImport, SerializeImportData } from '../../declarations';

/**
 * Serialize data about a style import to an annotated path, where
 * the filename has a URL query params style string appended to it.
 * This could look like:
 *
 * ```
 * './some-file.CSS?tag=my-tag&mode=ios&encapsulation=scoped');
 * ```
 *
 * @param data import data to be serialized
 * @param styleImportData an argument which controls whether the import data
 * will be added to the path (formatted as query params)
 * @returns a formatted string
 */
export const serializeImportPath = (data: SerializeImportData, styleImportData: string | undefined | null): string => {
  let p = data.importeePath;

  if (isString(p)) {
    if (isString(data.importerPath) && isAbsolute(data.importeePath)) {
      p = relative(dirname(data.importerPath), data.importeePath);
    }
    if (!p.startsWith('.')) {
      p = './' + p;
    }

    if (styleImportData === 'queryparams' || styleImportData === undefined) {
      const paramData: ImportData = {};
      if (isString(data.tag)) {
        paramData.tag = data.tag;
      }
      if (isString(data.mode) && data.mode !== DEFAULT_STYLE_MODE) {
        paramData.mode = data.mode;
      }
      if (isString(data.encapsulation) && data.encapsulation !== 'none') {
        paramData.encapsulation = data.encapsulation;
      }
      const paramEntries = Object.entries(paramData);
      if (paramEntries.length > 0) {
        const params = new URLSearchParams(paramEntries);
        p += '?' + params.toString();
      }
    }
  }

  return p;
};

/**
 * Parse import paths (filepaths possibly annotated w/ component metadata,
 * formatted as URL query params) into a structured format.
 *
 * @param importPath an annotated import path to examine
 * @returns formatted information about the import
 */
export const parseImportPath = (importPath: string) => {
  const parsedPath: ParsedImport = {
    importPath,
    basename: null,
    ext: null,
    data: null,
  };

  if (isString(importPath)) {
    const pathParts = importPath.split('?');

    parsedPath.basename = basename(pathParts[0].trim());
    const extParts = parsedPath.basename.toLowerCase().split('.');
    if (extParts.length > 1) {
      parsedPath.ext = extParts[extParts.length - 1];
      if (parsedPath.ext === 'ts' && extParts[extParts.length - 2] === 'd') {
        parsedPath.ext = 'd.ts';
      }
    }

    if (pathParts.length > 1) {
      const params = pathParts[1];
      const urlParams = new URLSearchParams(params);
      const tag = urlParams.get('tag');
      if (tag != null) {
        parsedPath.data = {
          tag,
          encapsulation: urlParams.get('encapsulation') || 'none',
          mode: urlParams.get('mode') || DEFAULT_STYLE_MODE,
        };
      }
    } else if (parsedPath.basename.endsWith('.css')) {
      parsedPath.data = {
        encapsulation: 'none',
      };
    }
  }

  return parsedPath;
};
