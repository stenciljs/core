import { normalizePath, relative } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { ValidatedConfig } from '../../declarations';
import { typeToString } from './transform-utils';

/**
 * This is a {@link d.JsonDocsTypeLibrary} cache which is used to store a
 * record of all the types referenced by components which are 'seen' during a
 * Stencil build
 */
const TYPE_LIBRARY: d.JsonDocsTypeLibrary = {};

/**
 * Add a type reference to the library if it has not already been added. This
 * function then returns the unique identifier for that type so a reference to
 * it can be stored.
 *
 * @param type the type we want to add
 * @param typeName the type's name
 * @param checker a {@link ts.TypeChecker} instance
 * @param pathToTypeModule the path to the home module of the type
 * @returns the unique ID for the type in question
 */
export function addToLibrary(
  type: ts.Type,
  typeName: string,
  checker: ts.TypeChecker,
  pathToTypeModule: string,
): string {
  pathToTypeModule = relative(process.cwd(), pathToTypeModule);

  // Create a stub path for types that are in node_modules,
  // this allows us to have a unique ID for types that are from
  // external packages so we can leverage the original type name when
  // dealing with type aliases.
  if (pathToTypeModule.startsWith('node_modules')) {
    return 'node_modules::' + typeName;
  }

  const id = getTypeId(pathToTypeModule, typeName);

  if (!type.isTypeParameter() && !(id in TYPE_LIBRARY)) {
    const declaration = getTypeDeclaration(checker, type);

    if (declaration !== '') {
      TYPE_LIBRARY[id] = {
        declaration,
        docstring: getTypeDocstring(type, checker),
        path: pathToTypeModule,
      };
    }
  }

  return id;
}

/**
 * This returns a reference to the cached {@link d.JsonDocsTypeLibrary} which
 * lives in this module.
 *
 * @returns a reference to the type library
 */
export function getTypeLibrary(): d.JsonDocsTypeLibrary {
  return TYPE_LIBRARY;
}

/**
 * Helper function that, given a file containing interfaces to document, will
 * add all the types exported from that file to the type library.
 *
 * This will exclude any types that are marked 'private' via JSDoc.
 *
 * @param config a validated user-supplied configuration
 * @param filePath the path to the file of interest (must be resolvable from
 * `process.cwd()`)
 */
export function addFileToLibrary(config: ValidatedConfig, filePath: string): void {
  const options = {
    ...ts.getDefaultCompilerOptions(),
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
  };
  const program = ts.createProgram([filePath], options);
  const checker = program.getTypeChecker();
  const compilerHost = ts.createCompilerHost(options);

  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
    config.logger.warn(
      `docs-json: unable to gather type information from "${filePath}". Please double check this path exists relative to your project root.`,
    );
    return;
  }

  // separate out the recursion logic for finding all the types we're concerned with
  // ideally this would be declared as a separate function, but given there's stuff we need to stand up
  // like the `ts.Program`, `ts.CompilerHost`, etc it's easier to do it inside
  // the scope of the outer `addFileToLibrary` function.
  function exportedTypesInSourceFile(
    sourceFile: ts.SourceFile,
    exportedTypeNodes: TypeDeclLike[] = [],
  ): TypeDeclLike[] {
    ts.forEachChild(sourceFile, (node) => {
      if (isTypeDeclLike(node) && isExported(node) && isNotPrivate(node)) {
        exportedTypeNodes.push(node);
      } else if (ts.isExportDeclaration(node)) {
        if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
          return;
        }

        const exportHomeModule = getHomeModule(sourceFile, node.moduleSpecifier.text, options, compilerHost, program);

        if (!exportHomeModule) {
          return;
        }

        // if there are named exports (like `export { Pie, Cake } from './dessert'`)
        // we get each export specifier (`Pie`, `Cake`), use the typechecker
        // to get its type, figure out the name, and so on.
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const exportSpecifier of node.exportClause.elements) {
            // this is the identifier in an export specifier, like 'Foo' below:
            //
            // ```ts
            // export { Foo } from './bar';
            //          ^^^
            // ```
            const identifier = exportSpecifier.getChildAt(0);
            if (!identifier) {
              return;
            }
            // if this symbol is being aliased like
            //
            // ```ts
            // export { Best as Worst } from './huh';
            // ```
            //
            // this will give us 'Best' as a symbol, letting us look that name up
            // in the source module, below
            const name = getOriginalTypeName(identifier, checker);

            ts.forEachChild(exportHomeModule, (child) => {
              if (isTypeDeclLike(child) && child.name.getText() === name) {
                exportedTypeNodes.push(child);
              }
            });
          }
        } else {
          // if it's _not_ a named export clause then it's something like `export
          // * from 'foo'`, so we need to deal with all the types exported from
          // that module. Conveniently, this very function does that! So we just
          // recur on the file from which we're exporting everything.
          exportedTypesInSourceFile(exportHomeModule, exportedTypeNodes);
        }
      }
    });
    return exportedTypeNodes;
  }

  // loop through the type nodes and add them to the library
  for (const node of exportedTypesInSourceFile(sourceFile)) {
    const type = checker.getTypeAtLocation(node);
    const typeName = node.name.getText();
    addToLibrary(type, typeName, checker, normalizePath(node.getSourceFile().fileName, false));
  }
}

/**
 * Given a `ts.SourceFile` representing an importer module and an import path
 * representing the path to another module, return the {@link ts.SourceFile}
 * corresponding to the imported module.
 *
 * @param importer the source file which imports the module of interest
 * @param importPath the import path to the module of interest
 * @param options typescript compiler options
 * @param compilerHost a {@link ts.CompilerHost}
 * @param program a {@link ts.Program}
 * @returns a {@link ts.SourceFile} for the imported module or `undefined` if
 * it can't be resolved
 */
export function getHomeModule(
  importer: ts.SourceFile,
  importPath: string,
  options: ts.CompilerOptions,
  compilerHost: ts.CompilerHost,
  program: ts.Program,
): ts.SourceFile | undefined {
  const module = ts.resolveModuleName(importPath, importer.fileName, options, compilerHost);
  const resolvedFileName = module?.resolvedModule?.resolvedFileName;

  if (!resolvedFileName) {
    return undefined;
  }
  const exportHomeModule = program.getSourceFile(resolvedFileName);
  return exportHomeModule;
}

/**
 * Given the name of a type, attempt to find the type declaration in the
 * {@link ts.SourceFile} where it is declared.
 *
 * @param module the home module for the type of interest
 * @param typeName the name of the type of interest
 * @returns a type declaration for the type of interest or `undefined` if it
 * cannot be found
 */
export function findTypeWithName(module: ts.SourceFile, typeName: string): TypeDeclLike | undefined {
  let typeWithName;
  ts.forEachChild(module, (child) => {
    if (isTypeDeclLike(child) && child.name.getText() === typeName) {
      typeWithName = child;
    }
  });
  return typeWithName;
}

/**
 * Get the original name for a given type, dereferencing if it's an alias for
 * another type.
 *
 * @param identifier an identifier for the type whose 'true name' we're after
 * @param checker a {@link ts.TypeChecker} instance
 * @returns the type's original, un-aliased name (if successful) or `undefined`
 * if not
 */
export function getOriginalTypeName(identifier: ts.Node, checker: ts.TypeChecker): string | undefined {
  const possiblyAliasedSymbol = checker.getSymbolAtLocation(identifier);
  if (!possiblyAliasedSymbol) {
    return undefined;
  }
  const unaliasedSymbol = unalias(possiblyAliasedSymbol, checker);
  const name = unaliasedSymbol.getName();
  return name;
}

/**
 * Check if a symbol is an alias of another symbol and, if so, use the
 * {@link ts.TypeChecker} to resolve the original. If not, just return the same
 * symbol.
 *
 * @param symbol the symbol of interest
 * @param checker a {@link ts.TypeChecker}
 * @returns a de-aliased symbol
 */
function unalias(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

/**
 * The 'type declaration like' syntax node types
 */
type TypeDeclLike = ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration;

/**
 * Check that a {@link ts.Node} is a type-declaration-like node. For our
 * purposes, this means that it is either an interface declaration, a type
 * alias, or an enum declaration.
 *
 * @param node a TypeScript syntax tree node
 * @returns whether or not this node is a type-declaration-like node
 */
function isTypeDeclLike(node: ts.Node): node is TypeDeclLike {
  return ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node);
}

/**
 * Check if a {@link ts.Declaration} is exported.
 *
 * @param node a TypeScript syntax tree node
 * @returns whether or not this node is exported
 */
function isExported(node: TypeDeclLike): boolean {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}

/**
 * Check that a {@link ts.Declaration} is not marked as 'private' via JSDoc.
 *
 * @param node a TypeScript syntax tree node to check
 * @returns whether or not this node is marked as 'private'
 */
function isNotPrivate(node: TypeDeclLike): boolean {
  const jsDocTags = ts.getJSDocTags(node);

  return !jsDocTags.some((tag) => tag.tagName.text === 'private');
}

/**
 * Get a string representation of the original declaration for a
 * {@link ts.Type} object.
 *
 * @param checker a {@link ts.TypeChecker} instance
 * @param type the type of interest
 * @returns a string containing the original declaration for that type
 */
function getTypeDeclaration(checker: ts.TypeChecker, type: ts.Type): string {
  const maybeSymbol = getSymbolForType(type);

  const declaration = maybeSymbol?.declarations?.[0];

  if (declaration) {
    return declaration.getText();
  } else {
    // in the case that we couldn't resolve the declaration, `typeToString`
    // provides a reasonable fallback
    return typeToString(checker, type);
  }
}

/**
 * Get docstring for a given type. Returns an empty string if no docstring is
 * present.
 *
 * @param type the type in question
 * @param checker a {@link ts.TypeChecker} instance
 * @returns the type's docstring if present, else an empty string
 */
function getTypeDocstring(type: ts.Type, checker: ts.TypeChecker): string {
  const symbol = type?.symbol;

  return symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : '';
}

/**
 * Get the unique ID for a type which was referenced somewhere within a Stencil project.
 *
 * We define a unique ID as the following string:
 *
 * ```ts
 * `${pathToTypeModule}::${typeName}`
 * ```
 *
 * where `pathToTypeModule` is the path to the type's home module and
 * `typeName` is the type's original name.
 *
 * The idea is that this defines an unambiguous identifier for types across a
 * Stencil project, so we can track the locations from which a given type is
 * referenced.
 *
 * @param pathToTypeModule the path to the home module for the type
 * @param typeName the type's name
 * @returns a formatted type ID
 */
const getTypeId = (pathToTypeModule: string, typeName: string): string => {
  return `${normalizePath(pathToTypeModule, false)}::${typeName}`;
};

/**
 * Get the symbol for a {@link ts.Type} node. This may be an alias.
 *
 * @param type the type of interest
 * @returns either a {@ts.Symbol} or `null`, if none found
 */
function getSymbolForType(type: ts.Type): ts.Symbol | null {
  if (type?.symbol) {
    return type.symbol;
  }
  if (type?.aliasSymbol) {
    return type.aliasSymbol;
  }
  return null;
}
