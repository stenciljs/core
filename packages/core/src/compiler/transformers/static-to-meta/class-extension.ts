import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildWarn, normalizePath, toDashCase } from '../../../utils';
import {
  tsResolveModuleName,
  tsGetSourceFile,
} from '../../sys/typescript/typescript-resolve-module';
import { convertDecoratorsToStatic } from '../decorators-to-static/convert-decorators';
import { detectModernPropDeclarations } from '../detect-modern-prop-decls';
import { isStaticGetter } from '../transform-utils';
import { parseStaticEvents } from './events';
import { parseStaticListeners } from './listeners';
import { parseStaticMethods } from './methods';
import { parseStaticProps } from './props';
import { parseStaticSerializers } from './serializers';
import { parseStaticStates } from './states';
import { parseStaticWatchers } from './watchers';

type DeDupeMember =
  | d.ComponentCompilerProperty
  | d.ComponentCompilerState
  | d.ComponentCompilerMethod
  | d.ComponentCompilerListener
  | d.ComponentCompilerEvent
  | d.ComponentCompilerChangeHandler;

type DependentClass = {
  classNode: ts.ClassDeclaration;
  sourceFile: ts.SourceFile;
  fileName: string;
};

/**
 * Given two arrays of static members, return a new array containing only the
 * members from the first array that are not present in the second array.
 * This is used to de-dupe static members that are inherited from a parent class.
 *
 * @param dedupeMembers the array of static members to de-dupe
 * @param staticMembers the array of static members to compare against
 * @returns an array of static members that are not present in the second array
 */
const deDupeMembers = <T extends DeDupeMember>(dedupeMembers: T[], staticMembers: T[]) => {
  return dedupeMembers.filter(
    (s) =>
      !staticMembers.some((d) => {
        if ((d as d.ComponentCompilerChangeHandler).methodName) {
          return (d as any).methodName === (s as any).methodName;
        }
        return (d as any).name === (s as any).name;
      }),
  );
};

/**
 * When a parent-class source file is fetched directly from disk (via
 * {@link tsGetSourceFile}) rather than from the compiler's moduleMap cache, it
 * arrives with its original decorator syntax intact.  The static-meta parsers
 * (`parseStaticProps`, `parseStaticStates`, etc.) only understand the static-
 * getter form produced by {@link convertDecoratorsToStatic}.
 *
 * This helper creates a self-contained mini TypeScript program for the single
 * file and runs the decorator→static transformer on it, returning the
 * transformed source file.  Prop types may be under-resolved (external imports
 * are not available in the mini program) and will fall back to `any`, which is
 * acceptable for the purpose of walking the inheritance chain.
 *
 * @param sourceFile the raw (decorator-syntax) source file from disk
 * @param config the current Stencil validated config
 * @param target the script target to use when converting decorators to static (if needed)
 * @returns the source file with decorators converted to static getters
 */
function convertDiskSourceFileDecorators(
  sourceFile: ts.SourceFile,
  config: d.ValidatedConfig,
  target: ts.ScriptTarget = ts.ScriptTarget.ESNext,
): ts.SourceFile {
  const compilerOptions: ts.CompilerOptions = {
    ...config.tsCompilerOptions,
    experimentalDecorators: true,
    noLib: true,
    noResolve: true,
    isolatedModules: false,
    // Ensure class fields are kept as declarations (not lowered to constructor
    // assignments), which detectModernPropDeclarations and the static-meta
    // parsers expect.
    target,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram([sourceFile.fileName], compilerOptions, host);
  const typeChecker = program.getTypeChecker();
  // IMPORTANT: use the source file from *this* program, not the one passed in.
  // Node text references (used by getText()) are scoped to the program that
  // created them; mixing nodes from different programs causes getText() to throw.
  const ownSourceFile = program.getSourceFile(sourceFile.fileName) ?? sourceFile;
  const result = ts.transform(ownSourceFile, [
    convertDecoratorsToStatic(config, [], typeChecker, program),
  ]);
  // Print and re-parse the transformed AST.  Nodes produced by ts.factory.create*
  // inside the transformer have no parent pointers, which causes getText() and
  // getSourceFile() to fail when buildExtendsTree recurses into this file.
  // A fresh parse gives us a fully-bound, self-consistent AST at the cost of
  // one extra parse (acceptable for the inheritance-chain walk).
  // `true` = setParentNodes so that getSourceFile() traversals work correctly.
  const printer = ts.createPrinter({ removeComments: false });
  const printed = printer.printFile(result.transformed[0]);
  return ts.createSourceFile(sourceFile.fileName, printed, target, true);
}

/**
 * Helper function to resolve and process an extended class from a module.
 * This handles:
 * 1. Resolving the module path
 * 2. Getting the source file
 * 3. Finding the class declaration
 * 4. Adding to dependent classes tree
 *
 * @param compilerCtx - the current compiler context
 * @param buildCtx - the current build context
 * @param classDeclaration - the current class being analyzed
 * @param currentSource - the source file of the current class
 * @param moduleSpecifier - the module path to resolve
 * @param className - the name of the class to find in the resolved module
 * @param dependentClasses - the array to add found classes to
 * @param typeChecker - the TypeScript type checker
 * @param ogModule - the original module file of the class declaration
 * @param targetScriptTarget - the script target to use when converting decorators to static (if needed)
 * @returns the found class declaration or undefined
 */
function resolveAndProcessExtendedClass(
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  classDeclaration: ts.ClassDeclaration,
  currentSource: ts.SourceFile,
  moduleSpecifier: string,
  className: string,
  dependentClasses: DependentClass[],
  typeChecker: ts.TypeChecker,
  ogModule: d.Module,
  targetScriptTarget: ts.ScriptTarget = ts.ScriptTarget.ESNext,
): ts.ClassDeclaration | undefined {
  // Start optimistic: set to false inside if the candidate turns out to be a
  // mixin factory (class wrapped in a function), in which case we cannot
  // meaningfully recurse further into its base classes.
  let keepLooking = true;
  const foundFile = tsResolveModuleName(
    buildCtx.config,
    compilerCtx,
    moduleSpecifier,
    currentSource.fileName,
  );

  if (!foundFile?.resolvedModule || !className) {
    return undefined;
  }

  // 1) resolve the module name to a file
  let foundSource: ts.SourceFile = compilerCtx.moduleMap.get(
    foundFile.resolvedModule.resolvedFileName,
  )?.staticSourceFile;

  if (!foundSource) {
    // Stencil only loads full-fledged component modules from node_modules collections,
    // so if we didn't find the source file in the module map,
    // let's create a temporary program and get the source file from there
    foundSource = tsGetSourceFile(buildCtx.config, foundFile);

    if (!foundSource) {
      // ts could not resolve the module. Likely because `allowJs` is not set to `true`
      const err = buildWarn(buildCtx.diagnostics);
      err.messageText = `Unable to resolve import "${moduleSpecifier}" from "${currentSource.fileName}". 
                    This can happen when trying to resolve .js files and "allowJs" is not set to "true" in your tsconfig.json.`;
      if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, classDeclaration);
      return undefined;
    }

    // The source came from disk (not from the pre-transformed moduleMap cache).
    // It may still use decorator syntax.  Run a self-contained decorator→static
    // pass so that parseStatic* can read the member names from static getters.
    foundSource = convertDiskSourceFileDecorators(foundSource, buildCtx.config, targetScriptTarget);
  }

  // 2) get the exported declaration from the module
  const matchedStatement = foundSource.statements.find(matchesNamedDeclaration(className));
  if (!matchedStatement) {
    // we couldn't find the imported declaration as an exported statement in the module
    const err = buildWarn(buildCtx.diagnostics);
    err.messageText = `Unable to find "${className}" in the imported module "${moduleSpecifier}". 
                  Please import class / mixin-factory declarations directly and not via barrel files.`;
    if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, classDeclaration);
    return undefined;
  }

  let foundClassDeclaration = matchedStatement
    ? ts.isClassDeclaration(matchedStatement)
      ? matchedStatement
      : undefined
    : undefined;

  if (!foundClassDeclaration && matchedStatement) {
    // the found `extends` type does not resolve to a class declaration;
    // if it's wrapped in a function - let's try and find it inside
    foundClassDeclaration = findClassWalk(matchedStatement);
    keepLooking = false;
  }

  if (
    foundClassDeclaration &&
    !dependentClasses.some((dc) => dc.classNode === foundClassDeclaration)
  ) {
    // 3) if we found the class declaration, push it and check if it itself extends from another class
    dependentClasses.push({
      classNode: foundClassDeclaration,
      sourceFile: foundSource,
      fileName: foundFile.resolvedModule.resolvedFileName,
    });

    if (keepLooking) {
      buildExtendsTree(
        compilerCtx,
        foundClassDeclaration,
        dependentClasses,
        typeChecker,
        buildCtx,
        ogModule,
      );
    }
  }

  return foundClassDeclaration;
}

/**
 * A recursive function that walks the AST to find a class declaration.
 * @param node the current AST node
 * @param depth the current depth in the AST
 * @param name optional name of the class to find
 * @returns the found class declaration or undefined
 */
function findClassWalk(node?: ts.Node, name?: string, depth = 0): ts.ClassDeclaration | undefined {
  if (!node) return undefined;

  if (node && ts.isClassDeclaration(node)) {
    if (!name || node.name?.text === name) {
      return node;
    }
  } else if (
    node &&
    ts.isVariableDeclaration(node) &&
    // @ts-ignore
    (!name || name === (node.name?.text || node.name?.escapedText)) &&
    node.initializer &&
    ts.isArrowFunction(node.initializer)
  ) {
    // handle case where class is wrapped in a mixin factory function
    let found: ts.ClassDeclaration | undefined;
    ts.forEachChild(node.initializer.body, (child) => {
      if (found) return;
      if (ts.isClassDeclaration(child)) found = child;
    });
    return found;
  }
  let found: ts.ClassDeclaration | undefined;

  ts.forEachChild(node, (child) => {
    if (found) return;
    const result = findClassWalk(child, name, depth + 1);
    if (result) found = result;
  });

  return found;
}

/**
 * A function that checks if a statement matches a named declaration.
 * @param name the name to match
 * @returns a function that checks if a statement is a named declaration
 */
function matchesNamedDeclaration(name: string) {
  return function (
    stmt: ts.Statement,
  ): stmt is ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement {
    // ClassDeclaration: class Foo {}
    if (ts.isClassDeclaration(stmt) && stmt.name?.text === name) {
      return true;
    }

    // FunctionDeclaration: function Foo() {}
    if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === name) {
      return true;
    }

    // VariableStatement: const Foo = ...
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name) {
          return true;
        }
      }
    }

    return false;
  };
}

/**
 * Helper function to convert a .d.ts declaration file path to its corresponding
 * .js source file path and get the source file from the compiler context.
 * This is needed because in external projects the extended class may only be found as a .d.ts declaration.
 *  *
 * @param declarationSourceFile the path to the .d.ts declaration file
 * @param compilerCtx the current compiler context
 * @returns the corresponding .js source file
 */
function convertDtsToJs(declarationSourceFile: string, compilerCtx: d.CompilerCtx): ts.SourceFile {
  const jsPath = normalizePath(
    declarationSourceFile.replace(/\.d\.ts$/, '.js').replace('/types/', '/collection/'),
  );
  const jsModule = compilerCtx.moduleMap.get(jsPath);
  return jsModule?.staticSourceFile as ts.SourceFile;
}

/**
 * A recursive function that builds a tree of classes that extend from each other.
 *
 * @param compilerCtx the current compiler context
 * @param classDeclaration a class declaration to analyze
 * @param dependentClasses a flat array tree of classes that extend from each other
 * @param typeChecker the TypeScript type checker
 * @param buildCtx the current build context
 * @param ogModule the original module file of the class declaration
 * @returns a flat array of classes that extend from each other, including the current class
 */
function buildExtendsTree(
  compilerCtx: d.CompilerCtx,
  classDeclaration: ts.ClassDeclaration,
  dependentClasses: DependentClass[],
  typeChecker: ts.TypeChecker,
  buildCtx: d.BuildCtx,
  ogModule: d.Module,
) {
  const hasHeritageClauses = classDeclaration.heritageClauses;
  if (!hasHeritageClauses?.length) return dependentClasses;

  const extendsClause = hasHeritageClauses.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  );
  if (!extendsClause) return dependentClasses;

  // Derive the script target from the original module's source file.  Disk-
  // fetched parent files are run through convertDecoratorsToStatic with this
  // target so that class fields are preserved at the correct language level.
  const targetScriptTarget: ts.ScriptTarget =
    (ogModule?.staticSourceFile as ts.SourceFile)?.languageVersion ?? ts.ScriptTarget.ESNext;

  let classIdentifiers: ts.Identifier[] = [];
  let foundClassDeclaration: ts.ClassDeclaration | undefined;
  // used when the class we found is wrapped in a mixin factory function -
  // the extender ctor will be from a dynamic function argument - so we stop recursing
  let keepLooking = true;

  extendsClause.types.forEach((type) => {
    if (
      ts.isExpressionWithTypeArguments(type) &&
      ts.isCallExpression(type.expression) &&
      type.expression.expression.getText() === 'Mixin'
    ) {
      // handle mixin case: extends Mixin(SomeClassFactoryFunction1, SomeClassFactoryFunction2)
      classIdentifiers = type.expression.arguments.filter(ts.isIdentifier);
    } else if (ts.isIdentifier(type.expression)) {
      // handle simple case: extends SomeClass
      classIdentifiers = [type.expression];
    }
  });

  classIdentifiers.forEach((extendee) => {
    try {
      // happy path (normally 1 file level removed): the extends type resolves to a class declaration in another file

      const symbol = typeChecker?.getSymbolAtLocation(extendee);
      const aliasedSymbol = symbol ? typeChecker.getAliasedSymbol(symbol) : undefined;

      let source = aliasedSymbol?.declarations?.[0].getSourceFile();
      let declarations: ts.Declaration[] | ts.Statement[] = aliasedSymbol?.declarations;

      if (source.fileName.endsWith('.d.ts')) {
        source = convertDtsToJs(source.fileName, compilerCtx);
        declarations = [...source.statements];
      }

      foundClassDeclaration = declarations?.find(ts.isClassDeclaration);

      if (!foundClassDeclaration) {
        // the found `extends` type does not resolve to a class declaration;
        // if it's wrapped in a function - let's try and find it inside
        const node = declarations?.[0];
        foundClassDeclaration = findClassWalk(node);
        if (!node) {
          throw 'revert to sad path';
        }
        keepLooking = false;
      }

      if (
        foundClassDeclaration &&
        !dependentClasses.some((dc) => dc.classNode === foundClassDeclaration)
      ) {
        const foundModule = compilerCtx.moduleMap.get(
          foundClassDeclaration.getSourceFile().fileName,
        );

        if (foundModule) {
          const moduleSourceFile = foundModule.staticSourceFile as ts.SourceFile;
          const sourceClass = findClassWalk(
            moduleSourceFile,
            foundClassDeclaration.name?.getText(),
          );

          if (sourceClass) {
            dependentClasses.push({
              classNode: sourceClass,
              sourceFile: moduleSourceFile,
              fileName: moduleSourceFile.fileName,
            });
            if (keepLooking) {
              buildExtendsTree(
                compilerCtx,
                foundClassDeclaration,
                dependentClasses,
                typeChecker,
                buildCtx,
                ogModule,
              );
            }
          }
        }
      }
    } catch {
      // sad path (>1 levels removed or node_modules): the extends type does not resolve so let's find it manually:

      const currentSource: ts.SourceFile =
        classDeclaration.getSourceFile() ?? extendee.getSourceFile() ?? ogModule?.staticSourceFile;
      let matchedStatement: ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement;

      if (currentSource) {
        matchedStatement = currentSource.statements.find(
          matchesNamedDeclaration(extendee.getText()),
        );
      }

      if (!currentSource) {
        // no source file :(
        const err = buildWarn(buildCtx.diagnostics);
        err.messageText = `Unable to find source file for class "${classDeclaration.name?.getText()}"`;
        if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, classDeclaration);
        return;
      }

      // try to see if we can find the class in the current source file first
      if (matchedStatement && ts.isClassDeclaration(matchedStatement)) {
        foundClassDeclaration = matchedStatement;
      } else if (matchedStatement) {
        // the found `extends` type does not resolve to a class declaration;
        // if it's wrapped in a function - let's try and find it inside
        foundClassDeclaration = findClassWalk(matchedStatement);
        keepLooking = false;
      } else {
        // class might be nested inside a function (e.g., in a test callback)
        // search the entire source file recursively for the class
        foundClassDeclaration = findClassWalk(currentSource, extendee.getText());
        keepLooking = false;
      }

      if (
        foundClassDeclaration &&
        !dependentClasses.some((dc) => dc.classNode === foundClassDeclaration)
      ) {
        // we found the class declaration in the current module
        // Try to get the transformed version from the module map
        const foundModule = compilerCtx.moduleMap.get(currentSource.fileName);
        if (foundModule?.staticSourceFile) {
          const transformedSource = foundModule.staticSourceFile as ts.SourceFile;
          const transformedClass = findClassWalk(
            transformedSource,
            foundClassDeclaration.name?.getText(),
          );

          if (transformedClass) {
            dependentClasses.push({
              classNode: transformedClass,
              sourceFile: transformedSource,
              fileName: transformedSource.fileName,
            });
            if (keepLooking) {
              buildExtendsTree(
                compilerCtx,
                transformedClass,
                dependentClasses,
                typeChecker,
                buildCtx,
                ogModule,
              );
            }
            return;
          }
        }

        // Fallback to original (for cases where module isn't in map yet)
        dependentClasses.push({
          classNode: foundClassDeclaration,
          sourceFile: currentSource,
          fileName: currentSource.fileName,
        });
        if (keepLooking) {
          buildExtendsTree(
            compilerCtx,
            foundClassDeclaration,
            dependentClasses,
            typeChecker,
            buildCtx,
            ogModule,
          );
        }
        return;
      }

      // if not found, let's check the import statements
      const importStatements = currentSource.statements.filter(ts.isImportDeclaration);
      importStatements.forEach((statement) => {
        // 1) loop through import declarations in the current source file
        if (
          statement.importClause?.namedBindings &&
          ts.isNamedImports(statement.importClause?.namedBindings)
        ) {
          statement.importClause?.namedBindings.elements.forEach((element) => {
            // 2) loop through the named bindings of the import declaration

            if (element.name.getText() === extendee.getText()) {
              // 3) check the name matches the `extends` type expression
              const className = element.propertyName?.getText() || element.name.getText();
              const moduleSpecifier = statement.moduleSpecifier.getText().replaceAll(/['"]/g, '');

              resolveAndProcessExtendedClass(
                compilerCtx,
                buildCtx,
                classDeclaration,
                currentSource,
                moduleSpecifier,
                className,
                dependentClasses,
                typeChecker,
                ogModule,
                targetScriptTarget,
              );
            }
          });
        }
      });
    }
  });

  return dependentClasses;
}

/**
 * Given a class declaration, this function will analyze its heritage clauses
 * to find any extended classes, and then parse the static members of those
 * extended classes to merge them into the current class's metadata.
 *
 * @param compilerCtx - the current compiler context
 * @param typeChecker - the TypeScript type checker
 * @param buildCtx - the current build context
 * @param cmpNode - the extending class declaration
 * @param staticMembers - the static members of the extending class to merge with the extended class members
 * @param moduleFile - the module file of the extending class
 * @returns an object containing merged metadata from extended classes
 */
export function mergeExtendedClassMeta(
  compilerCtx: d.CompilerCtx,
  typeChecker: ts.TypeChecker,
  buildCtx: d.BuildCtx,
  cmpNode: ts.ClassDeclaration,
  staticMembers: ts.ClassElement[],
  moduleFile: d.Module,
) {
  const tree = buildExtendsTree(compilerCtx, cmpNode, [], typeChecker, buildCtx, moduleFile);
  let hasMixin = false;
  let doesExtend = false;
  let properties = parseStaticProps(staticMembers);
  let states = parseStaticStates(staticMembers);
  let methods = parseStaticMethods(staticMembers);
  let listeners = parseStaticListeners(staticMembers);
  let events = parseStaticEvents(staticMembers);
  let watchers = parseStaticWatchers(staticMembers);
  let classMethods = cmpNode.members
    .filter(ts.isMethodDeclaration)
    .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
    .filter(Boolean);
  let serializers = parseStaticSerializers(staticMembers, 'serializers');
  let deserializers = parseStaticSerializers(staticMembers, 'deserializers');

  tree.forEach((extendedClass) => {
    const extendedStaticMembers = extendedClass.classNode.members.filter(isStaticGetter);
    const mixinProps = parseStaticProps(extendedStaticMembers) ?? [];
    const mixinStates = parseStaticStates(extendedStaticMembers) ?? [];
    const mixinMethods = parseStaticMethods(extendedStaticMembers) ?? [];
    const mixinEvents = parseStaticEvents(extendedStaticMembers) ?? [];
    const isMixin =
      mixinProps.length > 0 ||
      mixinStates.length > 0 ||
      mixinMethods.length > 0 ||
      mixinEvents.length > 0;
    const module = compilerCtx.moduleMap.get(extendedClass.fileName);
    // `module` may be undefined in the stateless transpile() context where
    // moduleMap is always empty.  Skip the metadata writes but still process
    // the inherited members so the component metadata is complete.
    if (module) {
      module.isMixin = isMixin;
      module.isExtended = true;
    }
    doesExtend = true;

    if (
      (mixinProps.length > 0 || mixinStates.length > 0) &&
      !detectModernPropDeclarations(extendedClass.classNode, extendedClass.sourceFile)
    ) {
      const err = buildWarn(buildCtx.diagnostics);
      const target = buildCtx.config.tsCompilerOptions?.target;
      err.messageText = `Component classes can only extend from other Stencil decorated base classes when targetting more modern JavaScript (ES2022 and above).
      ${target ? `Your current TypeScript configuration is set to target \`${ts.ScriptTarget[target]}\`.` : ''} Please amend your tsconfig.json.`;
      if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, extendedClass.classNode);
    }

    // Cross-type deduplication: if the component overrides a base @Prop with @State (or vice versa),
    // exclude the base member from the opposite type to prevent it appearing in both.
    const mixinPropsExcludingComponentStates = mixinProps.filter(
      (mp) => !states.some((s) => s.name === mp.name),
    );
    const mixinStatesExcludingComponentProps = mixinStates.filter(
      (ms) => !properties.some((p) => p.name === ms.name),
    );
    properties = [...deDupeMembers(mixinPropsExcludingComponentStates, properties), ...properties];
    states = [...deDupeMembers(mixinStatesExcludingComponentProps, states), ...states];
    methods = [...deDupeMembers(mixinMethods, methods), ...methods];
    events = [...deDupeMembers(mixinEvents, events), ...events];
    listeners = [
      ...deDupeMembers(parseStaticListeners(extendedStaticMembers) ?? [], listeners),
      ...listeners,
    ];
    watchers = [
      ...deDupeMembers(parseStaticWatchers(extendedStaticMembers) ?? [], watchers),
      ...watchers,
    ];
    serializers = [
      ...deDupeMembers(
        parseStaticSerializers(extendedStaticMembers, 'serializers') ?? [],
        serializers,
      ),
      ...serializers,
    ];
    deserializers = [
      ...deDupeMembers(
        parseStaticSerializers(extendedStaticMembers, 'deserializers') ?? [],
        deserializers,
      ),
      ...deserializers,
    ];
    classMethods = [
      ...classMethods,
      ...extendedClass.classNode.members
        .filter(ts.isMethodDeclaration)
        .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
        .filter(Boolean),
    ];

    if (isMixin) hasMixin = true;
  });

  return {
    hasMixin,
    doesExtend,
    properties,
    states,
    methods,
    listeners,
    events,
    watchers,
    classMethods,
    serializers,
    deserializers,
  };
}

// === Parse-only extraction for the transpile() context ===
// No TypeScript Program or TypeChecker — safe to call from transpileSync / transpile.

const EMPTY_DOCS: d.CompilerJsDoc = { text: '', tags: [] };
const EMPTY_PROP_COMPLEX_TYPE: d.ComponentCompilerPropertyComplexType = {
  original: 'any',
  resolved: 'any',
  references: {},
};
const EMPTY_EVENT_COMPLEX_TYPE: d.ComponentCompilerEventComplexType = {
  original: 'any',
  resolved: 'any',
  references: {},
};
const EMPTY_METHOD_COMPLEX_TYPE: d.ComponentCompilerMethodComplexType = {
  signature: '() => void',
  parameters: [],
  references: {},
  return: 'void',
};

function extractDecoratorOptions(
  node: ts.Expression | undefined,
): Record<string, string | boolean | number> {
  if (!node || !ts.isObjectLiteralExpression(node)) return {};
  const result: Record<string, string | boolean | number> = {};
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const key = prop.name.text;
    const val = prop.initializer;
    if (ts.isStringLiteral(val)) result[key] = val.text;
    else if (val.kind === ts.SyntaxKind.TrueKeyword) result[key] = true;
    else if (val.kind === ts.SyntaxKind.FalseKeyword) result[key] = false;
    else if (ts.isNumericLiteral(val)) result[key] = Number(val.text);
  }
  return result;
}

export interface ExtractedInheritedMeta {
  properties: d.ComponentCompilerProperty[];
  states: d.ComponentCompilerState[];
  methods: d.ComponentCompilerMethod[];
  events: d.ComponentCompilerEvent[];
  listeners: d.ComponentCompilerListener[];
  watchers: d.ComponentCompilerChangeHandler[];
  methodNames: string[];
}

/**
 * Extract Stencil member metadata from source text using parse-only TypeScript
 * (no Program, no TypeChecker). Handles both decorator syntax (.tsx source files)
 * and compiled static getter syntax (.js collection files).
 *
 * @param code source text to parse
 * @param className name of the class to extract metadata from
 * @param fileName virtual filename used to determine script kind
 * @returns extracted metadata, or null if the named class is not found
 */
export function extractInheritedMeta(
  code: string,
  className: string,
  fileName = '__stencil_parent__.tsx',
): ExtractedInheritedMeta | null {
  const scriptKind =
    fileName.endsWith('.tsx') || fileName.endsWith('.ts') ? ts.ScriptKind.TSX : ts.ScriptKind.JS;
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext, true, scriptKind);

  const classDecl = sf.statements
    .filter(ts.isClassDeclaration)
    .find((c) => c.name?.text === className);
  if (!classDecl) return null;

  const methodNames = classDecl.members
    .filter(ts.isMethodDeclaration)
    .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
    .filter(Boolean);

  // Detect compiled static getter form (collection .js files).
  // getStaticValue() is purely syntactic so it works on parse-only AST nodes.
  const staticMembers = classDecl.members.filter(isStaticGetter) as ts.ClassElement[];
  const hasStencilStaticGetters = staticMembers.some(
    (m) =>
      ts.isGetAccessorDeclaration(m) &&
      ts.isIdentifier(m.name) &&
      ['properties', 'states', 'events', 'listeners', 'watchers', 'methods'].includes(m.name.text),
  );

  if (hasStencilStaticGetters) {
    return {
      properties: parseStaticProps(staticMembers),
      states: parseStaticStates(staticMembers),
      methods: parseStaticMethods(staticMembers),
      events: parseStaticEvents(staticMembers),
      listeners: parseStaticListeners(staticMembers),
      watchers: parseStaticWatchers(staticMembers),
      methodNames,
    };
  }

  // Decorator syntax: walk class members and extract directly from AST.
  const properties: d.ComponentCompilerProperty[] = [];
  const states: d.ComponentCompilerState[] = [];
  const methods: d.ComponentCompilerMethod[] = [];
  const events: d.ComponentCompilerEvent[] = [];
  const listeners: d.ComponentCompilerListener[] = [];
  const watchers: d.ComponentCompilerChangeHandler[] = [];

  for (const member of classDecl.members) {
    if (!ts.isPropertyDeclaration(member) && !ts.isMethodDeclaration(member)) continue;
    if (!ts.isIdentifier(member.name)) continue;
    const memberName = member.name.text;

    const decorators = (ts.getDecorators?.(member) ?? []) as ts.Decorator[];

    for (const dec of decorators) {
      if (!ts.isCallExpression(dec.expression) || !ts.isIdentifier(dec.expression.expression))
        continue;
      const decName = dec.expression.expression.text;
      const args = dec.expression.arguments;

      if (decName === 'Prop' && ts.isPropertyDeclaration(member)) {
        const opts = extractDecoratorOptions(args[0]);
        properties.push({
          name: memberName,
          attribute:
            typeof opts.attribute === 'string'
              ? opts.attribute.toLowerCase()
              : toDashCase(memberName),
          reflect: !!opts.reflect,
          mutable: !!opts.mutable,
          required: false,
          optional: !!member.questionToken,
          type: 'any',
          complexType: EMPTY_PROP_COMPLEX_TYPE,
          docs: EMPTY_DOCS,
          internal: false,
          getter: false,
          setter: false,
        });
      } else if (decName === 'State' && ts.isPropertyDeclaration(member)) {
        states.push({ name: memberName });
      } else if (decName === 'Event' && ts.isPropertyDeclaration(member)) {
        const opts = extractDecoratorOptions(args[0]);
        events.push({
          name: typeof opts.eventName === 'string' ? opts.eventName : memberName,
          method: memberName,
          bubbles: opts.bubbles !== false,
          cancelable: opts.cancelable !== false,
          composed: !!opts.composed,
          docs: EMPTY_DOCS,
          complexType: EMPTY_EVENT_COMPLEX_TYPE,
          internal: false,
        });
      } else if (decName === 'Method' && ts.isMethodDeclaration(member)) {
        methods.push({
          name: memberName,
          docs: EMPTY_DOCS,
          complexType: EMPTY_METHOD_COMPLEX_TYPE,
          internal: false,
        });
      } else if (decName === 'Watch' && ts.isMethodDeclaration(member)) {
        const propName = ts.isStringLiteral(args[0]) ? args[0].text : null;
        if (propName) watchers.push({ propName, methodName: memberName });
      } else if (decName === 'Listen' && ts.isMethodDeclaration(member)) {
        const eventName = ts.isStringLiteral(args[0]) ? args[0].text : null;
        if (eventName) {
          const listenOpts = extractDecoratorOptions(args[1]);
          listeners.push({
            name: eventName,
            method: memberName,
            capture: !!listenOpts.capture,
            passive: !!listenOpts.passive,
            target:
              typeof listenOpts.target === 'string'
                ? (listenOpts.target as d.ListenTargetOptions)
                : undefined,
          });
        }
      }
    }
  }

  return { properties, states, methods, events, listeners, watchers, methodNames };
}

// === resolveImport-based inheritance merging ===
//
// The functions below provide an alternative to the TypeChecker-backed
// inheritance walk used by the full compiler build.  In the stateless
// `transpile()`/`transpileAsync()` path there is no `CompilerCtx`, no
// `moduleMap`, and no TypeScript program — only source text.  Instead of the
// TypeChecker we accept a caller-supplied `resolveImport` callback that maps
// an import specifier to source code, then parse each ancestor file on the fly
// and merge its metadata into the component.

function getExtendsClassName(node: ts.ClassDeclaration): string | null {
  const heritage = node.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ExtendsKeyword);
  if (!heritage?.types.length) return null;
  const expr = heritage.types[0].expression;
  return ts.isIdentifier(expr) ? expr.text : null;
}

function findImportSpecifier(sf: ts.SourceFile, localName: string): string | null {
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const clause = stmt.importClause;
    if (!clause) continue;
    // default import: import Foo from '...'
    if (clause.name?.text === localName) return stmt.moduleSpecifier.text;
    // named imports: import { Foo } or import { Foo as Bar }
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        if (el.name.text === localName) return stmt.moduleSpecifier.text;
      }
    }
  }
  return null;
}

/**
 * Resolves the inheritance chain for a component using a caller-supplied
 * `resolveImport` callback instead of the full compiler infrastructure.
 * Safe to call from `transpileSync`/`transpileAsync` (no TypeChecker needed).
 *
 * @param cmpNode the component's class declaration
 * @param staticMembers static getter members already parsed from the component
 * @param sourceFile the source file containing the component (for import resolution)
 * @param resolveImport callback that resolves an import specifier to source code
 * @returns merged metadata including all inherited members
 */
export function mergeExtendedClassMetaWithResolveImport(
  cmpNode: ts.ClassDeclaration,
  staticMembers: ts.ClassElement[],
  sourceFile: ts.SourceFile,
  resolveImport: (specifier: string, importer: string) => { code: string; path: string } | null,
) {
  let doesExtend = false;
  let properties = parseStaticProps(staticMembers);
  let states = parseStaticStates(staticMembers);
  let methods = parseStaticMethods(staticMembers);
  let listeners = parseStaticListeners(staticMembers);
  let events = parseStaticEvents(staticMembers);
  let watchers = parseStaticWatchers(staticMembers);
  let classMethods = cmpNode.members
    .filter(ts.isMethodDeclaration)
    .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
    .filter(Boolean);
  const serializers: d.ComponentCompilerChangeHandler[] = [];
  const deserializers: d.ComponentCompilerChangeHandler[] = [];

  let currentNode: ts.ClassDeclaration = cmpNode;
  let currentSf: ts.SourceFile = sourceFile;
  let currentPath = sourceFile.fileName;
  const visited = new Set<string>();

  while (true) {
    const parentClassName = getExtendsClassName(currentNode);
    if (!parentClassName) break;

    const specifier = findImportSpecifier(currentSf, parentClassName);
    if (!specifier) break;

    const resolved = resolveImport(specifier, currentPath);
    if (!resolved) break;

    const { code, path: resolvedPath } = resolved;
    if (visited.has(resolvedPath)) break; // cycle guard
    visited.add(resolvedPath);

    // Parse once; reuse for both meta extraction and next-level extends walk.
    const isTs = resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.ts');
    const parentSf = ts.createSourceFile(
      resolvedPath,
      code,
      ts.ScriptTarget.ESNext,
      true,
      isTs ? ts.ScriptKind.TSX : ts.ScriptKind.JS,
    );
    const parentClass = parentSf.statements
      .filter(ts.isClassDeclaration)
      .find((c) => c.name?.text === parentClassName);
    if (!parentClass) break;

    const parentStaticMembers = parentClass.members.filter(isStaticGetter) as ts.ClassElement[];
    const hasStaticGetters = parentStaticMembers.some(
      (m) =>
        ts.isGetAccessorDeclaration(m) &&
        ts.isIdentifier(m.name) &&
        ['properties', 'states', 'events', 'listeners', 'watchers', 'methods'].includes(
          m.name.text,
        ),
    );

    // Static-getter path avoids a second parse; decorator path calls extractInheritedMeta.
    const parentMeta = hasStaticGetters
      ? {
          properties: parseStaticProps(parentStaticMembers),
          states: parseStaticStates(parentStaticMembers),
          methods: parseStaticMethods(parentStaticMembers),
          events: parseStaticEvents(parentStaticMembers),
          listeners: parseStaticListeners(parentStaticMembers),
          watchers: parseStaticWatchers(parentStaticMembers),
          methodNames: parentClass.members
            .filter(ts.isMethodDeclaration)
            .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
            .filter(Boolean),
        }
      : extractInheritedMeta(code, parentClassName, resolvedPath);

    if (!parentMeta) break;

    doesExtend = true;

    const mixinPropsExcludingStates = parentMeta.properties.filter(
      (mp) => !states.some((s) => s.name === mp.name),
    );
    const mixinStatesExcludingProps = parentMeta.states.filter(
      (ms) => !properties.some((p) => p.name === ms.name),
    );
    properties = [...deDupeMembers(mixinPropsExcludingStates, properties), ...properties];
    states = [...deDupeMembers(mixinStatesExcludingProps, states), ...states];
    methods = [...deDupeMembers(parentMeta.methods, methods), ...methods];
    events = [...deDupeMembers(parentMeta.events, events), ...events];
    listeners = [...deDupeMembers(parentMeta.listeners, listeners), ...listeners];
    watchers = [...deDupeMembers(parentMeta.watchers, watchers), ...watchers];
    classMethods = [...classMethods, ...parentMeta.methodNames];

    currentNode = parentClass;
    currentSf = parentSf;
    currentPath = resolvedPath;
  }

  return {
    doesExtend,
    properties,
    states,
    methods,
    listeners,
    events,
    watchers,
    classMethods,
    serializers,
    deserializers,
  };
}
