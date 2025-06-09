import { catchError, createJsVarName, DEFAULT_STYLE_MODE, hasError, isString, normalizePath, resolve } from '@utils';
import { scopeCss } from '@utils/shadow-css';
import MagicString from 'magic-string';
import path from 'path';

import type * as d from '../../declarations';
import { parseStyleDocs } from '../docs/style-docs';
import { optimizeCss } from '../optimize/optimize-css';
import { serializeImportPath } from '../transformers/stencil-import-path';
import { getScopeId } from './scope-css';
import { stripCssComments } from './style-utils';

/**
 * A regular expression for matching CSS import statements
 *
 * According to https://developer.mozilla.org/en-US/docs/Web/CSS/@import
 * the formal grammar for CSS import statements is:
 *
 * ```
 * @import [ <url> | <string> ]
 *         [ supports( [ <supports-condition> | <declaration> ] ) ]?
 *         <media-query-list>? ;
 * ```
 *
 * Thus the string literal `"@import"` will be followed by a `<url>` or a
 * `<string>`, where a `<url>` may be a relative or absolute URL _or_ a `url()`
 * function.
 *
 * Thus the regular expression needs to match:
 *
 * - the string `"@import
 * - any amount of whitespace
 * - a URL, comprised of:
 *   - an optional `url(` function opener
 *   - a non-greedy match on any characters (to match the argument to the URL
 *     function)
 *   - an optional `)` closing paren on the `url()` function
 * - trailing characters after the URL, given by anything which doesn't match
 *   the line-terminator `;`
 *   - this can match media queries, support conditions, and so on
 * - a line-terminating semicolon
 *
 * The regex has 4 capture groups:
 *
 * 1. `@import`
 * 2. `url(`
 * 3. characters after `url(`
 * 4. all characters other than `;`, greedily matching
 *
 * We typically only care about group 4 here.
 */
const CSS_IMPORT_RE = /(@import)\s+(url\()?\s?(.*?)\s?\)?([^;]*);?/gi;

/**
 * Our main entry point to this module. This performs an async transformation
 * of CSS input to ESM.
 *
 * @param input CSS input to be transformed to ESM
 * @returns a promise wrapping transformed ESM output
 */
export const transformCssToEsm = async (input: d.TransformCssToEsmInput): Promise<d.TransformCssToEsmOutput> => {
  const results = transformCssToEsmModule(input);

  const optimizeResults = await optimizeCss({
    autoprefixer: input.autoprefixer,
    input: results.styleText,
    filePath: input.file,
    minify: true,
    sourceMap: input.sourceMap,
  });

  results.diagnostics.push(...optimizeResults.diagnostics);
  if (hasError(optimizeResults.diagnostics)) {
    return results;
  }
  results.styleText = optimizeResults.output;

  return generateTransformCssToEsm(input, results);
};

/**
 * A sync function for transforming input CSS to ESM
 *
 * @param input the input CSS we're going to transform
 * @returns transformed ESM output
 */
export const transformCssToEsmSync = (input: d.TransformCssToEsmInput): d.TransformCssToEsmOutput => {
  const results = transformCssToEsmModule(input);
  return generateTransformCssToEsm(input, results);
};

/**
 * Performs the actual transformation from CSS to ESM
 *
 * @param input input CSS to be transformed
 * @returns ESM output
 */
const transformCssToEsmModule = (input: d.TransformCssToEsmInput): d.TransformCssToEsmOutput => {
  const results: d.TransformCssToEsmOutput = {
    styleText: input.input,
    output: '',
    map: null,
    diagnostics: [],
    imports: [],
    defaultVarName: createCssVarName(input.file, input.mode),
    styleDocs: [],
  };

  if (input.docs) {
    parseStyleDocs(results.styleDocs, input.input, input.mode);
  }

  try {
    const varNames = new Set([results.defaultVarName]);

    if (isString(input.tag) && input.encapsulation === 'scoped') {
      const scopeId = getScopeId(input.tag, input.mode);
      results.styleText = scopeCss(results.styleText, scopeId, false);
    }

    const cssImports = getCssToEsmImports(varNames, results.styleText, input.file, input.mode);
    cssImports.forEach((cssImport) => {
      // remove the original css @imports
      results.styleText = results.styleText.replace(cssImport.srcImportText, '');

      const importPath = serializeImportPath(
        {
          importeePath: cssImport.filePath,
          importerPath: input.file,
          tag: input.tag,
          encapsulation: input.encapsulation,
          mode: input.mode,
        },
        input.styleImportData,
      );

      // str.append(`import ${cssImport.varName} from '${importPath}';\n`);
      results.imports.push({
        varName: cssImport.varName,
        importPath,
      });
    });
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
};

/**
 * Updated the `output` property on `results` with appropriate import statements for
 * the CSS import tree and the module type.
 *
 * @param input the CSS to ESM transform input
 * @param results the corresponding output
 * @returns the modified ESM output
 */
const generateTransformCssToEsm = (
  input: d.TransformCssToEsmInput,
  results: d.TransformCssToEsmOutput,
): d.TransformCssToEsmOutput => {
  const s = new MagicString('');

  if (input.module === 'cjs') {
    // CommonJS
    results.imports.forEach((cssImport) => {
      s.append(`const ${cssImport.varName} = require('${cssImport.importPath}');\n`);
    });

    s.append(`const ${results.defaultVarName} = `);

    results.imports.forEach((cssImport) => {
      s.append(`${cssImport.varName} + `);
    });

    s.append(`${JSON.stringify(results.styleText)};\n`);
    s.append(`module.exports = ${results.defaultVarName};`);
  } else {
    // ESM
    results.imports.forEach((cssImport) => {
      s.append(`import ${cssImport.varName} from '${cssImport.importPath}';\n`);
    });

    s.append(`const ${results.defaultVarName} = `);

    results.imports.forEach((cssImport) => {
      s.append(`${cssImport.varName} + `);
    });

    s.append(`${JSON.stringify(results.styleText)};\n`);
    s.append(`export default ${results.defaultVarName};`);
  }

  results.output = s.toString();
  return results;
};

/**
 * Get all of the CSS imports in a file
 *
 * @param varNames a set into which new names will be added
 * @param cssText the CSS text in question
 * @param filePath the file path to the file in question
 * @param modeName the current mode name
 * @returns an array of import objects
 */
const getCssToEsmImports = (
  varNames: Set<string>,
  cssText: string,
  filePath: string,
  modeName: string,
): d.CssToEsmImportData[] => {
  const cssImports: d.CssToEsmImportData[] = [];

  if (!cssText.includes('@import')) {
    // no @import at all, so don't bother
    return cssImports;
  }

  cssText = stripCssComments(cssText);

  const dir = path.dirname(filePath);

  let r: RegExpExecArray;
  while ((r = CSS_IMPORT_RE.exec(cssText))) {
    const cssImportData: d.CssToEsmImportData = {
      srcImportText: r[0],
      url: r[4].replace(/[\"\'\)]/g, ''),
      filePath: null,
      varName: null,
    };

    if (!isLocalCssImport(cssImportData.srcImportText)) {
      // do nothing for @import url(http://external.css)
      continue;
    } else if (isCssNodeModule(cssImportData.url)) {
      // do not resolve this path cuz it starts with node resolve id ~
      continue;
    } else if (path.isAbsolute(cssImportData.url)) {
      // absolute path already
      cssImportData.filePath = normalizePath(cssImportData.url);
    } else {
      // relative path
      cssImportData.filePath = normalizePath(resolve(dir, cssImportData.url));
    }

    cssImportData.varName = createCssVarName(cssImportData.filePath, modeName);

    if (varNames.has(cssImportData.varName)) {
      cssImportData.varName += varNames.size;
    }
    varNames.add(cssImportData.varName);

    cssImports.push(cssImportData);
  }

  return cssImports;
};

/**
 * Check if a module URL is a css node module
 *
 * @param url to check
 * @returns whether or not it's a Css node module
 */
const isCssNodeModule = (url: string): boolean => {
  return url.startsWith('~');
};

/**
 * Check if a given import is a local import or not (i.e. check that it
 * is not importing from some other domain)
 *
 * @param srcImport the import to check
 * @returns whether it's local or not
 */
const isLocalCssImport = (srcImport: string) => {
  srcImport = srcImport.toLowerCase();

  if (srcImport.includes('url(')) {
    srcImport = srcImport.replace(/\"/g, '');
    srcImport = srcImport.replace(/\'/g, '');
    srcImport = srcImport.replace(/\s/g, '');
    if (srcImport.includes('url(http') || srcImport.includes('url(//')) {
      return false;
    }
  }

  return true;
};

/**
 * Given a file path and a mode name, create an appropriate variable name
 *
 * @param filePath the path we want to use
 * @param modeName the name for the current style mode (i.e. `md` or `ios` on Ionic)
 * @returns an appropriate Css var name
 */
const createCssVarName = (filePath: string, modeName: string): string => {
  let varName = path.basename(filePath);
  if (modeName && modeName !== DEFAULT_STYLE_MODE && !varName.includes(modeName)) {
    varName = modeName + '-' + varName;
  }
  return createJsVarName(varName);
};
