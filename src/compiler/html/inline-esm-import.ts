import { isString, join } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { generateHashedCopy } from '../output-targets/copy/hashed-copy';
import { getAbsoluteBuildDir } from './html-utils';
import { injectModulePreloads } from './inject-module-preloads';

/**
 * Attempt to optimize an ESM import of the main entry point for a `www` build
 * by inlining the imported script within the supplied HTML document, if
 * possible.
 *
 * This will only do this for a `<script>` with type `"module"` where the
 * `"src"` attr matches the main entry point for the build. If such a
 * `<script>` is found the imported file will be resolved and edited in order
 * to allow it to be properly inlined. If there's no such `<script>` _or_ if
 * the file referenced by the `<script>` can't be resolved then no action
 * will be taken.
 *
 * @param config the current user-supplied Stencil config
 * @param compilerCtx a compiler context
 * @param doc the document in which to search for scripts to inline
 * @param outputTarget the output target for the www build we're optimizing
 * @returns whether or not a script was found and inlined
 */
export const optimizeEsmImport = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  doc: Document,
  outputTarget: d.OutputTargetWww,
): Promise<boolean> => {
  const resourcesUrl = getAbsoluteBuildDir(outputTarget);
  const entryFilename = `${config.fsNamespace}.esm.js`;
  const expectedSrc = join(resourcesUrl, entryFilename);

  const script = Array.from(doc.querySelectorAll('script')).find(
    (s) =>
      s.getAttribute('type') === 'module' && !s.hasAttribute('crossorigin') && s.getAttribute('src') === expectedSrc,
  );

  if (!script) {
    return false;
  }

  script.setAttribute('data-resources-url', resourcesUrl);
  script.setAttribute('data-stencil-namespace', config.fsNamespace);

  const entryPath = join(outputTarget.buildDir, entryFilename);
  const content = await compilerCtx.fs.readFile(entryPath);

  if (isString(content)) {
    // If the script is too big, instead of inlining, we hash the file and change
    // the <script> to the new location
    if (config.allowInlineScripts && content.length < MAX_JS_INLINE_SIZE) {
      // Let's try to inline, we have to fix all the relative paths of the imports
      const results = updateImportPaths(content, resourcesUrl);
      if (results.orgImportPaths.length > 0) {
        // insert inline script
        script.removeAttribute('src');
        // the `'\n'` is added here to avoid possible issues with HTML parsers
        // since the inlined JS will often end in a sourcemap-related `//`
        // comment a newline ensures that in the rendered HTML string the
        // closing script tag will be on its own line
        script.innerHTML = results.code + '\n';
      }
    } else {
      const hashedFile = await generateHashedCopy(config, compilerCtx, entryPath);
      if (hashedFile) {
        const hashedPath = join(resourcesUrl, hashedFile);
        script.setAttribute('src', hashedPath);
        injectModulePreloads(doc, [hashedPath]);
      }
    }
    return true;
  }
  return false;
};

/**
 * Update all relative module specifiers in some JS code to instead be nested
 * inside of a supplied directory, transforming e.g. all imports of the form
 * `'./foo.js'` to `'/build/foo.js'`.
 *
 * @param code the code to transform
 * @param newDir the directory which should be prepended to all module
 * specifiers in the code
 * @returns a manifest containing transformed code and a list of transformed
 * module specifiers
 */
export const updateImportPaths = (code: string, newDir: string) => {
  const orgModulePaths = readModulePaths(code);

  for (const orgImportPath of orgModulePaths) {
    const newPath = updateImportPathDir(orgImportPath, newDir);
    if (newPath) {
      code = code.replace(new RegExp(`"${orgImportPath}"`, 'g'), `"${newPath}"`);
      code = code.replace(new RegExp(`'${orgImportPath}'`, 'g'), `'${newPath}'`);
    }
  }

  return {
    code,
    orgImportPaths: orgModulePaths,
  };
};

/**
 * Update the directory of an ESM module specifier to include a new directory,
 * e.g. by transforming `./foo.js` to `/build/foo.js`.
 *
 * @param orgImportPath the original path as found in the un-transformed source
 * file
 * @param newDir the new directory path which should be prepended to the
 * original path
 * @returns an updated path or `null`
 */
const updateImportPathDir = (orgImportPath: string, newDir: string): string | null => {
  if (orgImportPath.startsWith('./') && (orgImportPath.endsWith('.js') || orgImportPath.endsWith('.mjs'))) {
    return newDir + orgImportPath.substring(2);
  }
  return null;
};

/**
 * Gather all module specifiers used in the `import` and `export` declarations
 * in a bit of JS code
 *
 * @param code the code to transform
 * @returns a list of the module specifiers present in the code
 */
function readModulePaths(code: string): string[] {
  const tsSourceFile = ts.createSourceFile('module.ts', code, ts.ScriptTarget.Latest);
  const orgModulePaths: string[] = [];

  for (const stmt of tsSourceFile.statements) {
    if (
      isImportOrExportDecl(stmt) &&
      stmt.moduleSpecifier != null &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      stmt.moduleSpecifier.text
    ) {
      orgModulePaths.push(stmt.moduleSpecifier.text);
    }
  }
  return orgModulePaths;
}

/**
 * Small type coercion / guard helper that returns whether or not a
 * {@link ts.Statement} is an import / export declaration
 *
 * @param stmt the statement of interest
 * @returns whether this is an import or export declaration or neither
 */
function isImportOrExportDecl(stmt: ts.Statement): stmt is ts.ImportDeclaration | ts.ExportDeclaration {
  return ts.isExportDeclaration(stmt) || ts.isImportDeclaration(stmt);
}

// https://twitter.com/addyosmani/status/1143938175926095872
const MAX_JS_INLINE_SIZE = 1 * 1024;
