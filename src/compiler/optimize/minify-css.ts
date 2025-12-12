import { hasError, isFunction, isString } from '@utils';

import { CssNode, CssNodeType } from '../style/css-parser/css-parse-declarations';
import { parseCss } from '../style/css-parser/parse-css';
import { serializeCss } from '../style/css-parser/serialize-css';

export const minifyCss = async (input: { css: string; resolveUrl?: (url: string) => Promise<string> | string }) => {
  const parseResults = parseCss(input.css);

  if (hasError(parseResults.diagnostics)) {
    return input.css;
  }
  if (isFunction(input.resolveUrl) && parseResults.stylesheet && Array.isArray(parseResults.stylesheet.rules)) {
    await resolveStylesheetUrl(parseResults.stylesheet.rules, input.resolveUrl, new Map());
  }

  return serializeCss(parseResults.stylesheet, {});
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
