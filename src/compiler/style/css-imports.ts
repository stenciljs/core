import { buildError, join, normalizePath } from '@utils';
import { basename, dirname, isAbsolute } from 'path';

import type * as d from '../../declarations';
import { parseStyleDocs } from '../docs/style-docs';
import { resolveModuleIdAsync } from '../sys/resolve/resolve-module-async';
import { getModuleId } from '../sys/resolve/resolve-utils';
import { stripCssComments } from './style-utils';

/**
 * Parse CSS imports into an object which contains a manifest of imports and a
 * stylesheet with all imports resolved and concatenated.
 *
 * @param config the current config
 * @param compilerCtx the compiler context (we need filesystem access)
 * @param buildCtx the build context, we'll need access to diagnostics
 * @param srcFilePath the source filepath
 * @param resolvedFilePath the resolved filepath
 * @param styleText style text we start with
 * @param styleDocs optional array of style document objects
 * @returns an object with concatenated styleText and imports
 */
export const parseCssImports = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  srcFilePath: string,
  resolvedFilePath: string,
  styleText: string,
  styleDocs?: d.StyleDoc[],
): Promise<ParseCSSReturn> => {
  const isCssEntry = resolvedFilePath.toLowerCase().endsWith('.css');
  const allCssImports: string[] = [];

  // a Set of previously-resolved file paths that we add to as we traverse the
  // import tree (to avoid a possible circular dependency and infinite loop)
  const resolvedFilePaths = new Set();

  const concatStyleText = await resolveAndFlattenImports(srcFilePath, resolvedFilePath, styleText);

  return {
    imports: allCssImports,
    styleText: concatStyleText,
  };

  /**
   * Resolve and flatten all imports for a given CSS file, recursively crawling
   * the tree of imports to resolve them all and produce a concatenated
   * stylesheet. We declare this function here, within `parseCssImports`, in order
   * to get access to `compilerCtx`, `buildCtx`, and more without having to pass
   * a whole bunch of arguments.
   *
   * @param srcFilePath the source filepath
   * @param resolvedFilePath the resolved filepath
   * @param styleText style text we start with*
   * @returns concatenated styles assembled from the various imported stylesheets
   */
  async function resolveAndFlattenImports(
    srcFilePath: string,
    resolvedFilePath: string,
    styleText: string,
  ): Promise<string> {
    // if we've seen this path before we early return
    if (resolvedFilePaths.has(resolvedFilePath)) {
      return styleText;
    }
    resolvedFilePaths.add(resolvedFilePath);

    if (styleDocs != null) {
      parseStyleDocs(styleDocs, styleText);
    }

    const cssImports = await getCssImports(config, compilerCtx, buildCtx, resolvedFilePath, styleText);
    if (cssImports.length === 0) {
      return styleText;
    }

    // add any newly-found imports to the 'global' list
    for (const cssImport of cssImports) {
      if (!allCssImports.includes(cssImport.filePath)) {
        allCssImports.push(cssImport.filePath);
      }
    }

    // Recur down the tree of CSS imports, resolving all the imports in
    // the children of the current file (and, by extension, in their children
    // and so on)
    await Promise.all(
      cssImports.map(async (cssImportData) => {
        cssImportData.styleText = await loadStyleText(compilerCtx, cssImportData);

        if (typeof cssImportData.styleText === 'string') {
          cssImportData.styleText = await resolveAndFlattenImports(
            cssImportData.filePath,
            cssImportData.filePath,
            cssImportData.styleText,
          );
        } else {
          // we had some error loading the file from disk, so write a diagnostic
          const err = buildError(buildCtx.diagnostics);
          err.messageText = `Unable to read css import: ${cssImportData.srcImport}`;
          err.absFilePath = srcFilePath;
        }
      }),
    );

    // replace import statements with the actual CSS code in children modules
    return replaceImportDeclarations(styleText, cssImports, isCssEntry);
  }
};

/**
 * Interface describing the return value of `parseCSSImports`
 */
interface ParseCSSReturn {
  /**
   * An array of filepaths to the imported CSS files
   */
  imports: string[];
  /**
   * The actual CSS text itself
   */
  styleText: string;
}

/**
 * Load the style text for a CSS file from disk, based on the filepaths set in
 * our import data.
 *
 * @param compilerCtx the compiler context
 * @param cssImportData the import data for the file we want to read
 * @returns the contents of the file, if it can be read without error
 */
const loadStyleText = async (compilerCtx: d.CompilerCtx, cssImportData: d.CssImportData): Promise<string | null> => {
  let styleText: string | null = null;

  try {
    styleText = await compilerCtx.fs.readFile(cssImportData.filePath);
  } catch (e) {
    if (cssImportData.altFilePath) {
      try {
        styleText = await compilerCtx.fs.readFile(cssImportData.filePath);
      } catch (e) {}
    }
  }

  return styleText;
};

/**
 * Get a manifest of all the CSS imports in a given CSS file
 *
 * @param config the current config
 * @param compilerCtx the compiler context (we need the filesystem)
 * @param buildCtx the build context, in case we need to set a diagnostic
 * @param filePath the filepath we're working with
 * @param styleText the CSS for which we want to retrieve import data
 * @returns a Promise wrapping a list of CSS import data objects
 */
export const getCssImports = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  filePath: string,
  styleText: string,
) => {
  const imports: d.CssImportData[] = [];

  if (!styleText.includes('@import')) {
    // no @import at all, so don't bother
    return imports;
  }
  styleText = stripCssComments(styleText);

  const dir = dirname(filePath);
  const importeeExt = (filePath.split('.').pop() ?? '').toLowerCase();

  let r: RegExpExecArray | null;
  const IMPORT_RE = /(@import)\s+(url\()?\s?(.*?)\s?\)?([^;]*);?/gi;
  while ((r = IMPORT_RE.exec(styleText))) {
    const cssImportData: d.CssImportData = {
      srcImport: r[0],
      url: r[4].replace(/[\"\'\)]/g, ''),
      filePath: '',
    };

    if (!isLocalCssImport(cssImportData.srcImport)) {
      // do nothing for @import url(http://external.css)
      config.logger.debug(`did not resolve external css @import: ${cssImportData.srcImport}`);
      continue;
    }

    if (isCssNodeModule(cssImportData.url)) {
      // node resolve this path cuz it starts with ~
      await resolveCssNodeModule(config, compilerCtx, buildCtx.diagnostics, filePath, cssImportData);
    } else if (isAbsolute(cssImportData.url)) {
      // absolute path already
      cssImportData.filePath = normalizePath(cssImportData.url);
    } else {
      // relative path
      cssImportData.filePath = normalizePath(join(dir, cssImportData.url));
    }

    if (importeeExt !== 'css' && !cssImportData.filePath.toLowerCase().endsWith('.css')) {
      cssImportData.filePath += `.${importeeExt}`;

      if (importeeExt === 'scss') {
        const fileName = '_' + basename(cssImportData.filePath);
        const dirPath = dirname(cssImportData.filePath);

        cssImportData.altFilePath = normalizePath(join(dirPath, fileName));
      }
    }

    // we set `filePath` to `""` when the object is created above, so if it
    // hasn't been changed in the intervening conditionals then we didn't resolve
    // a filepath for it.
    if (cssImportData.filePath !== '') {
      imports.push(cssImportData);
    }
  }

  return imports;
};

export const isCssNodeModule = (url: string) => url.startsWith('~');

export const resolveCssNodeModule = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  diagnostics: d.Diagnostic[],
  filePath: string,
  cssImportData: d.CssImportData,
) => {
  try {
    const m = getModuleId(cssImportData.url);
    const resolved = await resolveModuleIdAsync(config.sys, compilerCtx.fs, {
      moduleId: m.moduleId,
      containingFile: filePath,
      exts: [],
      packageFilter: (pkg) => {
        if (m.filePath !== '') {
          pkg.main = m.filePath;
        }
        return pkg;
      },
    });

    cssImportData.filePath = resolved.resolveId;
    cssImportData.updatedImport = `@import "${cssImportData.filePath}";`;
  } catch (e) {
    const d = buildError(diagnostics);
    d.messageText = `Unable to resolve node module for CSS @import: ${cssImportData.url}`;
    d.absFilePath = filePath;
  }
};

export const isLocalCssImport = (srcImport: string) => {
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
 * Replace import declarations (like '@import "foobar";') with the actual CSS
 * written in the imported module, allowing us to produce a single file from a
 * tree of stylesheets.
 *
 * @param styleText the text within which we want to replace @import statements
 * @param cssImports information about imported modules
 * @param isCssEntry whether we're dealing with a CSS file
 * @returns an updated string with the requisite substitutions
 */
export const replaceImportDeclarations = (styleText: string, cssImports: d.CssImportData[], isCssEntry: boolean) => {
  for (const cssImport of cssImports) {
    if (isCssEntry) {
      if (typeof cssImport.styleText === 'string') {
        styleText = styleText.replace(cssImport.srcImport, cssImport.styleText);
      }
    } else if (typeof cssImport.updatedImport === 'string') {
      styleText = styleText.replace(cssImport.srcImport, cssImport.updatedImport);
    }
  }
  return styleText;
};
