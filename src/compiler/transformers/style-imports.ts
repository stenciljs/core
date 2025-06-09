import ts from 'typescript';

import type * as d from '../../declarations';
import { serializeImportPath } from './stencil-import-path';
import { getExternalStyles, retrieveTsModifiers } from './transform-utils';

/**
 * This function adds imports (either in ESM or CJS syntax) for styles that are
 * imported from the component's styleUrls option. For example, if a component
 * has the following:
 *
 * ```ts
 * @Component({
 *  styleUrls: ['my-component.css', 'my-component.ios.css']
 * })
 * export class MyComponent {
 *   // ...
 * }
 * ```
 *
 * then this function will add the following import statement:
 *
 * ```ts
 * import MyComponentStyle0 from './my-component.css';
 * import MyComponentStyle1 from './my-component.ios.css';
 * ```
 *
 * Note that import identifier are used in [`addStaticStyleGetterWithinClass`](src/compiler/transformers/add-static-style.ts)
 * to attach them to a components static style property.
 *
 * @param transformOpts transform options configured for the current output target transpilation
 * @param tsSourceFile the TypeScript source file that is being updated
 * @param moduleFile component file to update
 * @returns an updated source file with the added import statements
 */
export const updateStyleImports = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module,
) => {
  // add style imports built from @Component() styleUrl option
  if (transformOpts.module === 'cjs') {
    return updateCjsStyleRequires(transformOpts, tsSourceFile, moduleFile);
  }

  return updateEsmStyleImports(transformOpts, tsSourceFile, moduleFile);
};

/**
 * Iterate over all components defined in given module, collect import
 * statements to be added and update source file with them.
 * @param transformOpts transform options configured for the current output target transpilation
 * @param tsSourceFile the TypeScript source file that is being updated
 * @param moduleFile component file to update
 * @returns update source file with added import statements
 */
const updateEsmStyleImports = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module,
) => {
  const styleImports: ts.Statement[] = [];
  let statements = tsSourceFile.statements.slice();
  let updateSourceFile = false;

  moduleFile.cmps.forEach((cmp) => {
    cmp.styles.forEach((style) => {
      if (typeof style.styleIdentifier === 'string') {
        updateSourceFile = true;
        if (style.externalStyles.length > 0) {
          // add style imports built from @Component() styleUrl option
          styleImports.push(...createStyleImport(transformOpts, tsSourceFile, cmp, style));
        } else {
          // update existing esm import of a style identifier
          statements = updateEsmStyleImportPath(transformOpts, tsSourceFile, statements, cmp, style);
        }
      }
    });
  });

  if (updateSourceFile) {
    let lastImportIndex = -1;

    for (let i = 0; i < statements.length; i++) {
      if (ts.isImportDeclaration(statements[i])) {
        lastImportIndex = i;
      }
    }

    statements.splice(lastImportIndex + 1, 0, ...styleImports);

    return ts.factory.updateSourceFile(tsSourceFile, statements);
  }

  return tsSourceFile;
};

const updateEsmStyleImportPath = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  statements: ts.Statement[],
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
): ts.Statement[] => {
  for (let i = 0; i < statements.length; i++) {
    const n = statements[i];
    if (ts.isImportDeclaration(n) && n.importClause && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      if (n.importClause.name && n.importClause.name.escapedText === style.styleIdentifier) {
        const orgImportPath = n.moduleSpecifier.text;
        const importPath = getStyleImportPath(transformOpts, tsSourceFile, cmp, style, orgImportPath);

        statements[i] = ts.factory.updateImportDeclaration(
          n,
          retrieveTsModifiers(n),
          n.importClause,
          ts.factory.createStringLiteral(importPath),
          undefined,
        );
        break;
      }
    }
  }
  return statements;
};

/**
 * Add import or require statement for each style
 * e.g. `import CMP__import_path_css from './import-path.css';`
 *
 * @param transformOpts transform options configured for the current output target transpilation
 * @param tsSourceFile the TypeScript source file that is being updated
 * @param cmp component meta data
 * @param style style meta data
 * @param moduleType module type (either 'esm' or 'cjs')
 * @returns an set or import or require statements to add to the source file
 */
const createStyleImport = <ModuleType extends 'esm' | 'cjs'>(
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
  /**
   * default to 'esm' if not provided, behavior defined in `updateStyleImports`
   */
  moduleType: ModuleType = 'esm' as ModuleType,
) => {
  type ImportDeclarationOrVariableStatementType = ModuleType extends 'esm'
    ? ts.ImportDeclaration
    : ts.VariableStatement;
  const imports: ImportDeclarationOrVariableStatementType[] = [];

  for (const [i, externalStyle] of Object.entries(getExternalStyles(style))) {
    /**
     * Concat styleId and absolutePath to get a unique identifier for each style.
     *
     * For example:
     * ```ts
     * @Component({
     *   styleUrls: {
     *     md: './foo/bar.css',
     *     ios: './bar/foo.css'
     *   },
     *   tag: 'cmp-a'
     * })
     * ```
     *
     * it would create the following identifiers:
     * ```ts
     * import CmpAStyle0 from './foo/bar.css';
     * import CmpAStyle1 from './bar/foo.css';
     * ```
     *
     * Attention: if you make changes to how this identifier is created you also need
     * to update this in [`createStyleIdentifierFromUrl`](`src/compiler/transformers/add-static-style.ts`).
     */
    const styleIdentifier = `${style.styleIdentifier}${i}`;
    const importIdentifier = ts.factory.createIdentifier(styleIdentifier);
    const importPath = getStyleImportPath(transformOpts, tsSourceFile, cmp, style, externalStyle);

    if (moduleType === 'esm') {
      imports.push(
        ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(false, importIdentifier, undefined),
          ts.factory.createStringLiteral(importPath),
        ) as ImportDeclarationOrVariableStatementType,
      );
    } else if (moduleType === 'cjs') {
      imports.push(
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                importIdentifier,
                undefined,
                undefined,
                ts.factory.createCallExpression(
                  ts.factory.createIdentifier('require'),
                  [],
                  [ts.factory.createStringLiteral(importPath)],
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ) as ImportDeclarationOrVariableStatementType,
      );
    } else {
      throw new Error(`Invalid module type: ${moduleType}`);
    }
  }

  return imports;
};

/**
 * Iterate over all components defined in given module, collect require
 * statements to be added and update source file with them.
 * @param transformOpts transform options configured for the current output target transpilation
 * @param tsSourceFile the TypeScript source file that is being updated
 * @param moduleFile component file to update
 * @returns update source file with added import statements
 */
const updateCjsStyleRequires = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module,
) => {
  const styleRequires: ts.Statement[] = [];

  moduleFile.cmps.forEach((cmp) => {
    cmp.styles.forEach((style) => {
      if (typeof style.styleIdentifier === 'string' && style.externalStyles.length > 0) {
        // add style imports built from @Component() styleUrl option
        styleRequires.push(...createStyleImport(transformOpts, tsSourceFile, cmp, style));
      }
    });
  });

  if (styleRequires.length > 0) {
    return ts.factory.updateSourceFile(tsSourceFile, [...styleRequires, ...tsSourceFile.statements]);
  }

  return tsSourceFile;
};

const getStyleImportPath = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
  importPath: string,
) => {
  const importData: d.SerializeImportData = {
    importeePath: importPath,
    importerPath: tsSourceFile.fileName,
    tag: cmp.tagName,
    encapsulation: cmp.encapsulation,
    mode: style.modeName,
  };
  return serializeImportPath(importData, transformOpts.styleImportData);
};
