import { SourceMapGenerator } from '@jridgewell/source-map';
import { hasError, isFunction, isString } from '@utils';
import sourceMapMerge from 'merge-source-map';

import type * as d from '../../declarations';
import { CssNode, CssNodeType } from '../style/css-parser/css-parse-declarations';
import { parseCss } from '../style/css-parser/parse-css';
import { serializeCss } from '../style/css-parser/serialize-css';

/**
 * Minifies a given CSS string by parsing it into an AST,
 * optionally resolving URLs, and serializing it back to a string.
 *
 * @param input An object containing the CSS string and an optional resolveUrl function to handle URL resolution.
 * @returns A promise that resolves to the minified CSS string.
 */
export const minifyCss = async (input: {
  css: string;
  filePath?: string;
  map?: d.SourceMap | string;
  sourceMap?: boolean;
  resolveUrl?: (url: string) => Promise<string> | string;
}): Promise<string | { output: string; map: d.SourceMap }> => {
  const parseResults = parseCss(input.css);

  if (hasError(parseResults.diagnostics)) {
    return input.css;
  }
  if (isFunction(input.resolveUrl) && parseResults.stylesheet && Array.isArray(parseResults.stylesheet.rules)) {
    await resolveStylesheetUrl(parseResults.stylesheet.rules, input.resolveUrl, new Map());
  }

  const output = serializeCss(parseResults.stylesheet, {});
  if (!input.sourceMap) {
    return output;
  }

  const map = createCssSourceMap(input.css, output, input.filePath || getSourceMapFile(input.map));
  const previousMap = parseSourceMap(input.map);
  return {
    output,
    map: previousMap ? sourceMapMerge(previousMap, map) : map,
  };
};

const parseSourceMap = (map?: d.SourceMap | string) => {
  if (typeof map === 'string') {
    try {
      return JSON.parse(map) as d.SourceMap;
    } catch (e) {
      return undefined;
    }
  }
  return map;
};

const getSourceMapFile = (map?: d.SourceMap | string) => parseSourceMap(map)?.file;

export const createCssSourceMap = (input: string, output: string, sourceFile = 'input.css'): d.SourceMap => {
  const generator = new SourceMapGenerator({ file: sourceFile });
  generator.setSourceContent(sourceFile, input);

  const tokenRe = /[^\s{};,:]+|[{};,:]/g;
  const inputLineStarts = getLineStarts(input);
  const outputLineStarts = getLineStarts(output);
  let match: RegExpExecArray | null;
  let searchFrom = 0;
  while ((match = tokenRe.exec(output))) {
    const token = match[0];
    const inputIndex = input.indexOf(token, searchFrom);
    const originalIndex = inputIndex === -1 ? Math.min(searchFrom, input.length - 1) : inputIndex;
    searchFrom = Math.max(searchFrom, originalIndex + token.length);
    const original = getLineAndColumn(inputLineStarts, originalIndex);
    const generated = getLineAndColumn(outputLineStarts, match.index);
    generator.addMapping({
      generated,
      original,
      source: sourceFile,
      name: '',
    });
  }

  return generator.toJSON() as d.SourceMap;
};

const getLineStarts = (text: string) => {
  const lineStarts = [0];
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '\n') {
      lineStarts.push(index + 1);
    }
  }
  return lineStarts;
};

const getLineAndColumn = (lineStarts: number[], index: number) => {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (lineStarts[middle] <= index) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  const lineIndex = Math.max(0, high);
  return { line: lineIndex + 1, column: index - lineStarts[lineIndex] };
};

const resolveStylesheetUrl = async (
  nodes: CssNode[],
  resolveUrl: (url: string) => Promise<string> | string,
  resolved: Map<string, string>,
) => {
  for (const node of nodes) {
    if (node.type === CssNodeType.Declaration && isString(node.value) && node.value.includes('url(')) {
      const urlSplt = node.value.split(',').map((n) => n.trim());
      for (let i = 0; i < urlSplt.length; i++) {
        const r = /url\((.*?)\)/.exec(urlSplt[i]);
        if (r) {
          try {
            const orgUrl = r[1].replace(/(\'|\")/g, '');
            const newUrl = await resolveUrl(orgUrl);
            urlSplt[i] = urlSplt[i].replace(orgUrl, newUrl);
          } catch (e) {}
        }
      }
      node.value = urlSplt.join(',');
    }
    if (Array.isArray(node.declarations)) {
      await resolveStylesheetUrl(node.declarations, resolveUrl, resolved);
    }
    if (Array.isArray(node.rules)) {
      await resolveStylesheetUrl(node.rules, resolveUrl, resolved);
    }
    if (Array.isArray(node.keyframes)) {
      await resolveStylesheetUrl(node.keyframes, resolveUrl, resolved);
    }
  }
};
