import { dirname } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import {
  augmentDiagnosticWithNode,
  buildWarn,
  join,
  normalizePath,
  relative,
} from '../../../../utils';
import { isNodeModulePath } from '../../../sys/resolve/resolve-utils';

// Helpers shared by both merge paths: compiler-ctx-merge.ts (the full
// compiler build) and resolve-import-merge.ts (the stateless transpile()
// path). Neither owns these - they're common ground between the two.

/**
 * Warns when an `extends`/`Mixin(...)` target resolved to *something* but no class declaration
 * could be found inside it - e.g. a mixin factory whose class isn't a named declaration
 * (`(Base) => class extends Base {}` rather than `(Base) => { class Foo extends Base {} return
 * Foo; }`). Without this, the target is silently dropped: any `@Prop`/`@State` etc. it declares
 * just never appears on the extending component, with no diagnostic explaining why.
 * @param buildCtx used to surface the warning - omit to warn silently (e.g. from tests)
 * @param targetName the identifier the target was reached through
 * @param anchor the node to attach the warning to
 */
export function warnMixinFactoryClassNotFound(
  buildCtx: d.BuildCtx | undefined,
  targetName: string,
  anchor: ts.Node,
): void {
  if (!buildCtx) return;
  const err = buildWarn(buildCtx.diagnostics);
  err.messageText = `Found "${targetName}", but couldn't find a class declaration inside it. If it's meant to be a mixin factory, make sure it declares and returns a named class, e.g. \`(Base) => { class ${targetName}Class extends Base {} return ${targetName}Class; }\` - a factory that returns a class expression directly (\`(Base) => class extends Base {}\`) isn't recognized, and any \`@Prop\`/\`@State\`/etc. it declares won't be applied.`;
  if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, anchor);
}

/**
 * Walks the AST looking for a class declaration, optionally by name - descends
 * into a mixin factory's wrapping function (arrow function or `function`
 * declaration) body too, since a mixin factory's class is always nested one
 * level inside it (e.g. `const Foo = (Base) => class extends Base {}`).
 * @param node the node to search from
 * @param name if given, only matches a class declaration with this name
 * @returns the found class declaration, or `undefined`
 */
export function findClassWalk(node?: ts.Node, name?: string): ts.ClassDeclaration | undefined {
  if (!node) return undefined;

  if (ts.isClassDeclaration(node)) {
    if (!name || node.name?.text === name) {
      return node;
    }
  } else if (
    ts.isVariableDeclaration(node) &&
    (!name || name === (node.name as ts.Identifier)?.text) &&
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
    const result = findClassWalk(child, name);
    if (result) found = result;
  });

  return found;
}

/**
 * Matches a top-level class/function/variable declaration by name - the three
 * shapes a mixin or base-class export can take (a plain class, a mixin
 * factory function declaration, or a mixin factory assigned to a `const`).
 * @param name the declaration name to match
 * @returns a predicate usable with `Array.prototype.find` over a source file's statements
 */
export function matchesNamedDeclaration(name: string) {
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
 * Finds a re-export of `className` in `sourceFile` - `export { X } from './y'` or
 * `export { X as Y } from './y'` - as used by barrel entry points (e.g. `@stencil/core`'s own
 * public `index.d.mts`, which re-exports its runtime API from `./declarations/stencil-public-runtime`
 * rather than declaring it directly).
 * @param sourceFile the (barrel) source file to scan
 * @param className the exported name to look for
 * @returns the module specifier and the name to look for in that module (the local name, before
 * any `as` aliasing), or `undefined` if no matching re-export is found
 */
export function findReExport(
  sourceFile: ts.SourceFile,
  className: string,
): { moduleSpecifier: string; localName: string } | undefined {
  for (const stmt of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(stmt) ||
      !stmt.moduleSpecifier ||
      !ts.isStringLiteral(stmt.moduleSpecifier) ||
      !stmt.exportClause ||
      !ts.isNamedExports(stmt.exportClause)
    ) {
      continue;
    }
    for (const element of stmt.exportClause.elements) {
      if (element.name.text === className) {
        return {
          moduleSpecifier: stmt.moduleSpecifier.text,
          localName: element.propertyName?.text ?? element.name.text,
        };
      }
    }
  }
  return undefined;
}

export type DeDupeMember =
  | d.ComponentCompilerProperty
  | d.ComponentCompilerState
  | d.ComponentCompilerMethod
  | d.ComponentCompilerListener
  | d.ComponentCompilerEvent
  | d.ComponentCompilerChangeHandler;

/**
 * Filters `dedupeMembers` down to entries not already present in `staticMembers`
 * (by name, or `methodName` for change handlers) - used so an extending
 * class's own members win over inherited ones.
 *
 * @param dedupeMembers the members to filter
 * @param staticMembers the members to filter against
 * @returns the filtered `dedupeMembers` array
 */
export const deDupeMembers = <T extends DeDupeMember>(dedupeMembers: T[], staticMembers: T[]) => {
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

// Prefixes `./` onto a specifier that isn't already explicitly relative.
const ensureRelativeSpecifier = (specifier: string): string => {
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
};

/**
 * Re-anchors inherited members' complex-type references - recorded relative
 * to the file declaring them - so they resolve from the extending
 * component's file instead. Consumers like `components.d.ts` generation
 * always resolve a reference against the component, not the declaring class,
 * so an inherited reference from a different directory would otherwise
 * produce a broken import.
 *
 * `import` refs get their relative path rewritten; `local` refs (a type
 * declared in the extended class's own file) become `import` refs pointing
 * at that file. Also applies to `node_modules`-published collections:
 * `dist/types/` mirrors `dist/collection/` 1:1, so the same math works after
 * swapping one for the other (type-only declarations don't survive
 * compilation to `.js`, so a reference has to point at the `.d.ts` tree).
 *
 * @param members inherited members whose type references should be re-anchored
 * @param extendedClassFileName absolute path of the file declaring the extended class
 * @param cmpSourceFilePath absolute path of the extending component's source file
 * @returns the same members, with their type references re-anchored
 */
export const reanchorInheritedTypeReferences = <
  T extends d.ComponentCompilerProperty | d.ComponentCompilerEvent | d.ComponentCompilerMethod,
>(
  members: T[],
  extendedClassFileName: string,
  cmpSourceFilePath: string,
): T[] => {
  const extendedClassDir = dirname(normalizePath(extendedClassFileName, false));
  const cmpDir = dirname(normalizePath(cmpSourceFilePath, false));
  if (extendedClassDir === cmpDir) {
    // specifiers already resolve correctly from the component's directory
    return members;
  }
  // Only compiled collection dependencies need the `dist/collection` ->
  // `dist/types` swap; a no-op everywhere else (including collections that
  // don't ship a `collection` output target - the path just won't resolve,
  // same as before this existed).
  const isCollectionModule = isNodeModulePath(extendedClassFileName);
  const toDeclarationPath = (path: string) =>
    isCollectionModule ? path.replace('/collection/', '/types/') : path;

  members.forEach((member) => {
    const references = member.complexType?.references;
    if (!references) {
      return;
    }
    Object.values(references).forEach((reference) => {
      if (reference.location === 'import' && reference.path?.startsWith('.')) {
        const typeModulePath = toDeclarationPath(join(extendedClassDir, reference.path));
        reference.path = ensureRelativeSpecifier(relative(cmpDir, typeModulePath));
      } else if (reference.location === 'local') {
        const extendedClassModule = toDeclarationPath(
          normalizePath(extendedClassFileName, false).replace(/\.(tsx|ts|js)$/, ''),
        );
        reference.location = 'import';
        reference.path = ensureRelativeSpecifier(relative(cmpDir, extendedClassModule));
      }
    });
  });
  return members;
};
