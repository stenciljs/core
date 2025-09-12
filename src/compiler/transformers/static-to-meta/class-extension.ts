import ts from 'typescript';
import { augmentDiagnosticWithNode, buildWarn } from '@utils';
import { tsResolveModuleName } from '../../sys/typescript/typescript-resolve-module';
import { isStaticGetter } from '../transform-utils';
import { parseStaticEvents } from './events';
import { parseStaticListeners } from './listeners';
import { parseStaticMethods } from './methods';
import { parseStaticProps } from './props';
import { parseStaticStates } from './states';
import { parseStaticWatchers } from './watchers';

import type * as d from '../../../declarations';
import { detectModernPropDeclarations } from '../detect-modern-prop-decls';

type DeDupeMember =
  | d.ComponentCompilerProperty
  | d.ComponentCompilerState
  | d.ComponentCompilerMethod
  | d.ComponentCompilerListener
  | d.ComponentCompilerEvent
  | d.ComponentCompilerWatch;

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
        if ((d as d.ComponentCompilerWatch).methodName) {
          return (d as any).methodName === (s as any).methodName;
        }
        return (d as any).name === (s as any).name;
      }),
  );
};

/**
 * A recursive function that walks the AST to find a class declaration.
 * @param node the current AST node
 * @param depth the current depth in the AST
 * @param name optional name of the class to find
 * @returns the found class declaration or undefined
 */
function findClassWalk(node?: ts.Node, name?: string): ts.ClassDeclaration | undefined {
  if (!node) return undefined;
  if (node && ts.isClassDeclaration(node) && (!name || node.name?.text === name)) {
    return node;
  }
  let found: ts.ClassDeclaration | undefined;

  ts.forEachChild(node, (child) => {
    if (found) return;
    const result = findClassWalk(child, name);
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
  return function (stmt: ts.Statement): stmt is ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement {
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
 * A recursive function that builds a tree of classes that extend from each other.
 *
 * @param compilerCtx the current compiler context
 * @param classDeclaration a class declaration to analyze
 * @param dependentClasses a flat array tree of classes that extend from each other
 * @param typeChecker the TypeScript type checker
 * @returns a flat array of classes that extend from each other, including the current class
 */
function buildExtendsTree(
  compilerCtx: d.CompilerCtx,
  classDeclaration: ts.ClassDeclaration,
  dependentClasses: { classNode: ts.ClassDeclaration; fileName: string }[],
  typeChecker: ts.TypeChecker,
  buildCtx: d.BuildCtx,
) {
  const hasHeritageClauses = classDeclaration.heritageClauses;
  if (!hasHeritageClauses?.length) return dependentClasses;

  const extendsClause = hasHeritageClauses.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
  if (!extendsClause) return dependentClasses;

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

      const symbol = typeChecker.getSymbolAtLocation(extendee);
      const aliasedSymbol = symbol ? typeChecker.getAliasedSymbol(symbol) : undefined;
      foundClassDeclaration = aliasedSymbol?.declarations?.find(ts.isClassDeclaration);

      if (!foundClassDeclaration) {
        // the found `extends` type does not resolve to a class declaration;
        // if it's wrapped in a function - let's try and find it inside
        const node = aliasedSymbol?.declarations?.[0];
        foundClassDeclaration = findClassWalk(node);
        keepLooking = false;
      }

      if (foundClassDeclaration && !dependentClasses.some((dc) => dc.classNode === foundClassDeclaration)) {
        const foundModule = compilerCtx.moduleMap.get(foundClassDeclaration.getSourceFile().fileName);

        if (foundModule) {
          const source = foundModule.staticSourceFile as ts.SourceFile;
          const sourceClass = findClassWalk(source, foundClassDeclaration.name?.getText());

          if (sourceClass) {
            dependentClasses.push({ classNode: sourceClass, fileName: source.fileName });
            if (keepLooking) {
              buildExtendsTree(compilerCtx, foundClassDeclaration, dependentClasses, typeChecker, buildCtx);
            }
          }
        }
      }
    } catch (_e) {
      // sad path (normally >1 levels removed): the extends type does not resolve so let's find it manually:

      const currentSource = classDeclaration.getSourceFile();
      if (!currentSource) return;

      // let's see if we can find the class in the current source file first
      const matchedStatement = currentSource.statements.find(matchesNamedDeclaration(extendee.getText()));

      if (matchedStatement && ts.isClassDeclaration(matchedStatement)) {
        foundClassDeclaration = matchedStatement;
      } else if (matchedStatement) {
        // the found `extends` type does not resolve to a class declaration;
        // if it's wrapped in a function - let's try and find it inside
        foundClassDeclaration = findClassWalk(matchedStatement);
        keepLooking = false;
      }

      if (foundClassDeclaration && !dependentClasses.some((dc) => dc.classNode === foundClassDeclaration)) {
        // we found the class declaration in the current module
        dependentClasses.push({ classNode: foundClassDeclaration, fileName: currentSource.fileName });
        if (keepLooking) {
          buildExtendsTree(compilerCtx, foundClassDeclaration, dependentClasses, typeChecker, buildCtx);
        }
        return;
      }

      // if not found, let's check the import statements
      const importStatements = currentSource.statements.filter(ts.isImportDeclaration);
      importStatements.forEach((statement) => {
        // 1) loop through import declarations in the current source file
        if (statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause?.namedBindings)) {
          statement.importClause?.namedBindings.elements.forEach((element) => {
            // 2) loop through the named bindings of the import declaration

            if (element.name.getText() === extendee.getText()) {
              // 3) check the name matches the `extends` type expression
              const className = element.propertyName?.getText() || element.name.getText();
              const foundFile = tsResolveModuleName(
                buildCtx.config,
                compilerCtx,
                statement.moduleSpecifier.getText().replaceAll(/['"]/g, ''),
                currentSource.fileName,
              );

              if (foundFile?.resolvedModule && className) {
                // 4) resolve the module name to a file
                const foundModule = compilerCtx.moduleMap.get(foundFile.resolvedModule.resolvedFileName);

                // 5) look for the corresponding resolved statement
                const matchedStatement = (foundModule?.staticSourceFile as ts.SourceFile).statements.find(
                  matchesNamedDeclaration(className),
                );
                foundClassDeclaration = matchedStatement
                  ? ts.isClassDeclaration(matchedStatement)
                    ? matchedStatement
                    : undefined
                  : undefined;

                if (!foundClassDeclaration && matchedStatement) {
                  // 5.b) the found `extends` type does not resolve to a class declaration;
                  // if it's wrapped in a function - let's try and find it inside
                  foundClassDeclaration = findClassWalk(matchedStatement);
                  keepLooking = false;
                }

                if (foundClassDeclaration && !dependentClasses.some((dc) => dc.classNode === foundClassDeclaration)) {
                  // 6) if we found the class declaration, push it and check if it itself extends from another class
                  dependentClasses.push({ classNode: foundClassDeclaration, fileName: currentSource.fileName });
                  if (keepLooking) {
                    buildExtendsTree(compilerCtx, foundClassDeclaration, dependentClasses, typeChecker, buildCtx);
                  }
                  return;
                }
              }
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
 * @param compilerCtx
 * @param typeChecker
 * @param buildCtx
 * @param cmpNode
 * @param staticMembers
 * @returns an object containing merged metadata from extended classes
 */
export function mergeExtendedClassMeta(
  compilerCtx: d.CompilerCtx,
  typeChecker: ts.TypeChecker,
  buildCtx: d.BuildCtx,
  cmpNode: ts.ClassDeclaration,
  staticMembers: ts.ClassElement[],
) {
  const tree = buildExtendsTree(compilerCtx, cmpNode, [], typeChecker, buildCtx);
  let hasMixin = false;
  let doesExtend = false;
  let properties = parseStaticProps(staticMembers);
  let states = parseStaticStates(staticMembers);
  let methods = parseStaticMethods(staticMembers);
  let listeners = parseStaticListeners(staticMembers);
  let events = parseStaticEvents(staticMembers);
  let watchers = parseStaticWatchers(staticMembers);
  let classMethods = cmpNode.members.filter(ts.isMethodDeclaration);

  tree.forEach((extendedClass) => {
    const extendedStaticMembers = extendedClass.classNode.members.filter(isStaticGetter);
    const mixinProps = parseStaticProps(extendedStaticMembers) ?? [];
    const mixinStates = parseStaticStates(extendedStaticMembers) ?? [];
    const mixinMethods = parseStaticMethods(extendedStaticMembers) ?? [];
    const isMixin = mixinProps.length > 0 || mixinStates.length > 0;
    const module = compilerCtx.moduleMap.get(extendedClass.fileName);
    if (!module) return;

    module.isMixin = isMixin;
    module.isExtended = true;
    doesExtend = true;

    if (isMixin && !detectModernPropDeclarations(extendedClass.classNode)) {
      const err = buildWarn(buildCtx.diagnostics);
      const target = buildCtx.config.tsCompilerOptions?.target;
      err.messageText = `Component classes can only extend from other Stencil decorated base classes when targetting more modern JavaScript (ES2022 and above).
      ${target ? `Your current TypeScript configuration is set to target \`${ts.ScriptTarget[target]}\`.` : ''} Please amend your tsconfig.json.`;
      if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, extendedClass.classNode);
    }

    properties = [...deDupeMembers(mixinProps, properties), ...properties];
    states = [...deDupeMembers(mixinStates, states), ...states];
    methods = [...deDupeMembers(mixinMethods, methods), ...methods];
    listeners = [...deDupeMembers(parseStaticListeners(extendedStaticMembers) ?? [], listeners), ...listeners];
    events = [...deDupeMembers(parseStaticEvents(extendedStaticMembers) ?? [], events), ...events];
    watchers = [...deDupeMembers(parseStaticWatchers(extendedStaticMembers) ?? [], watchers), ...watchers];
    classMethods = [...classMethods, ...(extendedClass.classNode.members.filter(ts.isMethodDeclaration) ?? [])];

    if (isMixin) hasMixin = true;
  });

  return { hasMixin, doesExtend, properties, states, methods, listeners, events, watchers, classMethods };
}
