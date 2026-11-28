import nodePath from 'node:path';
import type * as d from '@stencil/core';
import type { OutputOptions, SourceMap as RolldownSourceMap } from 'rolldown';

import { normalizePath, relative, resolve } from './path';

/**
 * Converts a rolldown provided source map to one that Stencil can easily understand
 * @param rolldownSourceMap the sourcemap to transform
 * @returns the transformed sourcemap
 */
export function rolldownToStencilSourceMap(rolldownSourceMap: null): null;
export function rolldownToStencilSourceMap(rolldownSourceMap: undefined): null;
export function rolldownToStencilSourceMap(rolldownSourceMap: RolldownSourceMap): d.SourceMap;
export function rolldownToStencilSourceMap(
  rolldownSourceMap: RolldownSourceMap | undefined | null,
): d.SourceMap | null {
  if (!rolldownSourceMap || !rolldownSourceMap.file) {
    return null;
  }

  return {
    file: rolldownSourceMap.file,
    mappings: rolldownSourceMap.mappings,
    names: rolldownSourceMap.names,
    sources: rolldownSourceMap.sources,
    sourcesContent: rolldownSourceMap.sourcesContent,
    version: rolldownSourceMap.version,
  } satisfies d.SourceMap;
}

/**
 * A JavaScript formatted string used to link generated code back to the original. This string follows the guidelines
 * found in the [Linking generated code to source maps](https://sourcemaps.info/spec.html#h.lmz475t4mvbx) section of
 * the Sourcemaps V3 specification proposal.
 */
const JS_SOURCE_MAPPING_URL_LINKER = '//# sourceMappingURL=';

/**
 * Generates an RFC-3986 compliant string for the given input.
 * More information about RFC-3986 can be found [here](https://datatracker.ietf.org/doc/html/rfc3986)
 * This function's original source is derived from
 * [MDN's encodeURIComponent documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#description)
 * @param filename the filename to encode
 * @returns the encoded URI
 */
const encodeToRfc3986 = (filename: string): string => {
  const encodedUri = encodeURIComponent(filename);
  // replace all '!', single quotes, '(', ')', and '*' with their hexadecimal values (UTF-16)
  return encodedUri.replace(/[!'()*]/g, (matchedCharacter) => {
    return '%' + matchedCharacter.charCodeAt(0).toString(16);
  });
};

/**
 * Generates a string used to link generated code with the original source, to be placed at the end of the generated
 * code.
 * @param url the url of the source map
 * @returns a linker string, of the format {@link JS_SOURCE_MAPPING_URL_LINKER}=<url>
 */
export const getSourceMappingUrlLinker = (url: string): string => {
  return `${JS_SOURCE_MAPPING_URL_LINKER}${encodeToRfc3986(url)}`;
};

/**
 * Generates a string used to link generated code with the original source, to be placed at the end of the generated
 * code as an inline source map.
 * @param sourceMapContents the sourceMapContents of the source map
 * @returns a linker string, of the format {@link JS_SOURCE_MAPPING_URL_LINKER}<dataUriPrefixAndMime><sourceMapContents>
 */
export const getInlineSourceMappingUrlLinker = (sourceMapContents: string): string => {
  const mapBase64 = Buffer.from(sourceMapContents, 'utf8').toString('base64');

  // do not RFC-3986 encode an already valid base64 string. the sourcemaps will not resolve correctly when there is an
  // allowed base64 character is encoded (because it is a disallowed RFC-3986 character)
  return `${JS_SOURCE_MAPPING_URL_LINKER}data:application/json;charset=utf-8;base64,${mapBase64}`;
};

/**
 * Generates a string used to link generated code with the original source, to be placed at the end of the generated
 * code. This function prepends a newline to the string.
 * @param url the url of the source map
 * @returns a linker string, of the format {@link JS_SOURCE_MAPPING_URL_LINKER}=<url>.map, prepended with a newline
 */
export const getSourceMappingUrlForEndOfFile = (url: string): string => {
  return `\n${getSourceMappingUrlLinker(url)}.map`;
};

/**
 * Rolldown source map output options. Stencil appends its own `sourceMappingURL` comment, so the map
 * is `hidden`. A chunk can be written to several directories, so `sources` are made absolute here
 * (query strings stripped) and relative to each destination by {@link relativizeSourceMap}.
 * Virtual modules have no file and keep their id.
 *
 * @param config the validated Stencil configuration
 * @returns the source map options to spread into Rolldown's output options
 */
export const getRolldownSourceMapOptions = (
  config: d.ValidatedConfig,
): Pick<OutputOptions, 'sourcemap' | 'sourcemapPathTransform'> => ({
  sourcemap: config.sourceMap ? 'hidden' : false,
  sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
    const absPath = resolve(nodePath.dirname(sourcemapPath), relativeSourcePath.split('?')[0]);
    // Rolldown resolves a virtual module's id against its (default) cwd
    return config.sys.accessSync(absPath) ? absPath : relative(process.cwd(), absPath);
  },
});

/**
 * Makes a source map's absolute `sources` relative to where the map is written, and names the
 * file it maps.
 *
 * @param sourceMap the source map, with absolute `sources` from {@link getRolldownSourceMapOptions}
 * @param filePath the path the mapped `.js` file is written to
 * @returns the source map to write next to `filePath`
 */
export const relativizeSourceMap = (sourceMap: d.SourceMap, filePath: string): d.SourceMap => {
  const dir = nodePath.dirname(filePath);
  return {
    ...sourceMap,
    file: nodePath.basename(filePath),
    sources: sourceMap.sources.map((source) =>
      nodePath.isAbsolute(source) ? relative(dir, source) : normalizePath(source, false),
    ),
  };
};
