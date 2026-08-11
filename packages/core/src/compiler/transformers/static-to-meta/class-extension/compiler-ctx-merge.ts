import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildWarn, normalizePath } from '../../../../utils';
import {
  tsGetSourceFile,
  tsResolveModuleName,
} from '../../../sys/typescript/typescript-resolve-module';
import { convertDecoratorsToStatic } from '../../decorators-to-static/convert-decorators';
import { detectModernPropDeclarations } from '../../detect-modern-prop-decls';
import { isStaticGetter } from '../../transform-utils';
import { parseStaticEvents } from '../events';
import { parseStaticListeners } from '../listeners';
import { parseStaticMethods } from '../methods';
import { parseStaticProps } from '../props';
import { parseStaticSerializers } from '../serializers';
import { parseStaticStates } from '../states';
import { parseStaticWatchers } from '../watchers';
import { deDupeMembers, reanchorInheritedTypeReferences } from './shared';

type DependentClass = {
  classNode: ts.ClassDeclaration;
  sourceFile: ts.SourceFile;
  fileName: string;
};

/**
 * Converts a disk-fetched parent source file (still decorator syntax) to
 * static-getter form via a throwaway single-file program - `parseStatic*`
 * only understands the static-getter form {@link convertDecoratorsToStatic}
 * produces. Cross-file imports can't resolve in this mini program, so prop
 * types may fall back to `any`, which is fine for just walking the chain.
 * @param sourceFile the raw (decorator-syntax) source file from disk
 * @param config the current Stencil validated config
 * @param target the script target to convert decorators with
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
    // class fields must stay as declarations (not lowered to constructor
    // assignments) for detectModernPropDeclarations and the static-meta parsers
    target,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram([sourceFile.fileName], compilerOptions, host);
  const typeChecker = program.getTypeChecker();
  // node references are scoped to the program that created them - use this
  // program's own SourceFile, not the one passed in
  const ownSourceFile = program.getSourceFile(sourceFile.fileName) ?? sourceFile;
  const result = ts.transform(ownSourceFile, [
    convertDecoratorsToStatic(config, [], typeChecker, program),
  ]);
  // re-parse: factory-created nodes have no parent pointers, which breaks
  // getSourceFile() when buildExtendsTree recurses into this file
  const printer = ts.createPrinter({ removeComments: false });
  const printed = printer.printFile(result.transformed[0]);
  return ts.createSourceFile(sourceFile.fileName, printed, target, true);
}

/**
 * Resolves an `extends` target through a module specifier: resolves the
 * module, finds the named class/mixin-factory export, and adds it (and its
 * own ancestors) to `dependentClasses`.
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param classDeclaration the current class being analyzed
 * @param currentSource the source file of the current class
 * @param moduleSpecifier the module path to resolve
 * @param className the name of the class to find in the resolved module
 * @param dependentClasses the array to add found classes to
 * @param typeChecker the TypeScript type checker
 * @param ogModule the original module file of the class declaration
 * @param targetScriptTarget the script target to convert decorators with, if needed
 * @returns the found class declaration, or `undefined`
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
  // starts optimistic: set false below if the candidate is a mixin factory
  // (class wrapped in a function), which we can't meaningfully recurse into
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

    // came from disk, not the pre-transformed moduleMap cache - may still be
    // decorator syntax, so run it through the same disk conversion
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
    // wrapped in a function (mixin factory) - try to find the class inside
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

// Walks the AST looking for a class declaration, optionally by name -
// descends into a mixin factory's arrow-function body too.
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
    // class wrapped in a mixin factory function
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

// Matches a top-level class/function/variable declaration by name.
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

// Maps a `.d.ts` declaration path to its compiled `.js` counterpart and looks
// it up in the module map - needed since an external project's extended
// class may only be found as a declaration file.
function convertDtsToJs(declarationSourceFile: string, compilerCtx: d.CompilerCtx): ts.SourceFile {
  const jsPath = normalizePath(
    declarationSourceFile.replace(/\.d\.ts$/, '.js').replace('/types/', '/collection/'),
  );
  const jsModule = compilerCtx.moduleMap.get(jsPath);
  return jsModule?.staticSourceFile as ts.SourceFile;
}

/**
 * Recursively walks a class's heritage clauses to build a flat list of every
 * class it extends from (and their own ancestors in turn).
 * @param compilerCtx the current compiler context
 * @param classDeclaration a class declaration to analyze
 * @param dependentClasses the flat array to accumulate found classes into
 * @param typeChecker the TypeScript type checker
 * @param buildCtx the current build context
 * @param ogModule the original module file of the class declaration
 * @returns `dependentClasses`, mutated in place
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

  // disk-fetched parent files are converted with this target so class fields
  // stay at the right language level
  const targetScriptTarget: ts.ScriptTarget =
    (ogModule?.staticSourceFile as ts.SourceFile)?.languageVersion ?? ts.ScriptTarget.ESNext;

  let classIdentifiers: ts.Identifier[] = [];
  let foundClassDeclaration: ts.ClassDeclaration | undefined;
  // set when the found class is wrapped in a mixin factory function - the
  // extender ctor comes from a dynamic function argument, so stop recursing
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

      let symbol = typeChecker?.getSymbolAtLocation(extendee);
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
        symbol = typeChecker.getAliasedSymbol(symbol);
      }

      let source = symbol?.declarations?.[0].getSourceFile();
      let declarations: ts.Declaration[] | ts.Statement[] = symbol?.declarations;

      if (source.fileName.endsWith('.d.ts')) {
        source = convertDtsToJs(source.fileName, compilerCtx);
        declarations = [...source.statements];
      }

      foundClassDeclaration = declarations?.find(ts.isClassDeclaration);

      if (!foundClassDeclaration) {
        // wrapped in a function - try to find the class inside
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
        // wrapped in a function - try to find the class inside
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
        // we found the class declaration in the current module - try to get
        // the transformed version from the module map
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

        // fallback to original (for cases where module isn't in map yet)
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
 * Analyzes a class's heritage clauses to find any extended classes, then
 * merges their static members into the extending class's own metadata.
 * @param compilerCtx the current compiler context
 * @param typeChecker the TypeScript type checker
 * @param buildCtx the current build context
 * @param cmpNode the extending class declaration
 * @param staticMembers the static members of the extending class
 * @param moduleFile the module file of the extending class
 * @returns the merged metadata from `cmpNode` and every class it extends
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
    const mixinProps = reanchorInheritedTypeReferences(
      parseStaticProps(extendedStaticMembers) ?? [],
      extendedClass.fileName,
      moduleFile.sourceFilePath,
    );
    const mixinStates = parseStaticStates(extendedStaticMembers) ?? [];
    const mixinMethods = reanchorInheritedTypeReferences(
      parseStaticMethods(extendedStaticMembers) ?? [],
      extendedClass.fileName,
      moduleFile.sourceFilePath,
    );
    const mixinEvents = reanchorInheritedTypeReferences(
      parseStaticEvents(extendedStaticMembers) ?? [],
      extendedClass.fileName,
      moduleFile.sourceFilePath,
    );
    const isMixin =
      mixinProps.length > 0 ||
      mixinStates.length > 0 ||
      mixinMethods.length > 0 ||
      mixinEvents.length > 0;
    const module = compilerCtx.moduleMap.get(extendedClass.fileName);
    // may be undefined in the stateless transpile() context, where moduleMap
    // is always empty - skip the metadata writes but keep merging members
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

    // if the component overrides a base @Prop with @State (or vice versa),
    // exclude the base member from the opposite type so it isn't duplicated
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
