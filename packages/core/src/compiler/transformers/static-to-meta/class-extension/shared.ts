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
import { isLocalModule, isNodeModulePath } from '../../../sys/resolve/resolve-utils';
import {
  tsResolveModuleName,
  tsResolveModuleNamePackageJsonPath,
} from '../../../sys/typescript/typescript-resolve-module';

// Helpers shared by both merge paths: compiler-ctx-merge.ts (the full
// compiler build) and resolve-import-merge.ts (the stateless transpile()
// path). Neither owns these - they're common ground between the two.

/**
 * Warns when an `extends`/`Mixin(...)` target resolved to *something* but no class literal
 * could be found inside it - e.g. a mixin factory that returns an existing class by reference
 * (`(Base) => SomeExistingClass`) rather than a class literal. Without this, the target is
 * silently dropped: any `@Prop`/`@State` etc. it declares just never appears on the extending
 * component, with no diagnostic explaining why.
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
  err.messageText = `Found "${targetName}", but couldn't find a class inside it. If it's meant to be a mixin factory, make sure it returns a class literal directly, e.g. \`(Base) => class extends Base {}\` or \`(Base) => { class ${targetName}Class extends Base {} return ${targetName}Class; }\` - returning an existing class by reference (\`(Base) => SomeExistingClass\`) isn't recognized, and any \`@Prop\`/\`@State\`/etc. it declares won't be applied.`;
  if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, anchor);
}

/**
 * Walks the AST looking for a class declaration or class expression, optionally by name -
 * descends into a mixin factory's wrapping function (arrow function or `function` declaration)
 * body too, since a mixin factory's class is always nested one level inside it. Recognizes all of:
 * `const Foo = (Base) => class extends Base {}` (concise arrow body), `const Foo = (Base) => {
 * return class extends Base {}; }` (block body, `return` of a class expression), and `const Foo =
 * (Base) => { class FooClass extends Base {} return FooClass; }` (block body, named declaration).
 * @param node the node to search from
 * @param name if given, only matches a class with this name
 * @returns the found class, or `undefined`
 */
export function findClassWalk(node?: ts.Node, name?: string): ts.ClassLikeDeclaration | undefined {
  if (!node) return undefined;

  if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
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
    const body = node.initializer.body;
    if (ts.isClassExpression(body)) {
      // concise arrow body: (Base) => class extends Base {}
      return body;
    }
    let found: ts.ClassLikeDeclaration | undefined;
    ts.forEachChild(body, (child) => {
      if (found) return;
      if (ts.isClassDeclaration(child)) {
        found = child;
      } else if (
        ts.isReturnStatement(child) &&
        child.expression &&
        ts.isClassExpression(child.expression)
      ) {
        // block body: (Base) => { return class extends Base {}; }
        found = child.expression;
      }
    });
    return found;
  }
  let found: ts.ClassLikeDeclaration | undefined;

  ts.forEachChild(node, (child) => {
    if (found) return;
    const result = findClassWalk(child, name);
    if (result) found = result;
  });

  return found;
}

/**
 * The declared name of a mixin-factory statement (`function Foo() {}`, or `const Foo = ...`) -
 * survives the decorator-to-static-getter transform even when the factory's inner class doesn't
 * have a name of its own, so it can anchor a post-transform re-lookup via `findClassWalk`.
 * @param node the factory statement (or its variable declaration) to read a name from
 * @returns the declared name, or `undefined` if it can't be determined
 */
export function factoryDeclaredName(
  node:
    | ts.FunctionDeclaration
    | ts.VariableStatement
    | ts.VariableDeclaration
    | ts.Node
    | undefined,
): string | undefined {
  if (!node) return undefined;
  if (ts.isFunctionDeclaration(node)) return node.name?.text;
  if (ts.isVariableDeclaration(node))
    return ts.isIdentifier(node.name) ? node.name.text : undefined;
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    return decl && ts.isIdentifier(decl.name) ? decl.name.text : undefined;
  }
  return undefined;
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
 * Finds a re-export of `className` in `sourceFile`: `export { X } from './y'`, or the
 * bundler-split shape `import { X as name } from './y'; export { name };` (no `from` clause).
 * @param sourceFile the (barrel) source file to scan
 * @param className the exported name to look for
 * @returns the module specifier and name to look for there (before any `as` aliasing), or
 * `undefined` if not found
 */
export function findReExport(
  sourceFile: ts.SourceFile,
  className: string,
): { moduleSpecifier: string; localName: string } | undefined {
  for (const stmt of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(stmt) ||
      !stmt.exportClause ||
      !ts.isNamedExports(stmt.exportClause)
    ) {
      continue;
    }
    const element = stmt.exportClause.elements.find((el) => el.name.text === className);
    if (!element) {
      continue;
    }
    if (stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)) {
      return {
        moduleSpecifier: stmt.moduleSpecifier.text,
        localName: element.propertyName?.text ?? element.name.text,
      };
    }
    // no `from` clause - re-exporting a name this file imported itself
    const importedName = element.propertyName?.text ?? element.name.text;
    const importOrigin = findImportOrigin(sourceFile, importedName);
    if (importOrigin) {
      return importOrigin;
    }
  }
  return undefined;
}

/**
 * Finds `name`'s import in `sourceFile` and returns its module and origin name (before any `as`
 * aliasing; `'default'` for a default import).
 * @param sourceFile the source file to scan for a matching import
 * @param name the local (post-aliasing) name an import bound
 * @returns the import's module specifier and origin name, or `undefined` if `name` isn't imported
 */
export function findImportOrigin(
  sourceFile: ts.SourceFile,
  name: string,
): { moduleSpecifier: string; localName: string } | undefined {
  for (const stmt of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(stmt) ||
      !stmt.importClause ||
      !ts.isStringLiteral(stmt.moduleSpecifier)
    ) {
      continue;
    }
    const moduleSpecifier = stmt.moduleSpecifier.text;
    if (stmt.importClause.name?.text === name) {
      return { moduleSpecifier, localName: 'default' };
    }
    const bindings = stmt.importClause.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) {
      continue;
    }
    const element = bindings.elements.find((el) => el.name.text === name);
    if (element) {
      return { moduleSpecifier, localName: element.propertyName?.text ?? element.name.text };
    }
  }
  return undefined;
}

/**
 * Finds `name` as a top-level declaration in `sf` (see `matchesNamedDeclaration`), following a
 * same-file export alias if `name` is only ever the public side of a local rename
 * (`export { RealName as name }`, no `from` clause).
 * @param sf the source file to search
 * @param name the declaration name to look for, which may only exist as an export alias
 * @returns the matched statement, or `undefined`
 */
export function findStatementByName(
  sf: ts.SourceFile,
  name: string,
): ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement | undefined {
  const direct = sf.statements.find(matchesNamedDeclaration(name));
  if (direct) {
    return direct;
  }
  for (const stmt of sf.statements) {
    if (
      !ts.isExportDeclaration(stmt) ||
      stmt.moduleSpecifier ||
      !stmt.exportClause ||
      !ts.isNamedExports(stmt.exportClause)
    ) {
      continue;
    }
    const element = stmt.exportClause.elements.find((el) => el.name.text === name);
    const aliasedName = element?.propertyName?.text;
    if (aliasedName && aliasedName !== name) {
      return sf.statements.find(matchesNamedDeclaration(aliasedName));
    }
  }
  return undefined;
}

/**
 * Picks the runtime target out of a `package.json` `exports` condition entry - prefers `import`
 * over `require`/`node`/`default`, recursing into nested condition objects.
 * @param entry an `exports` map value: a path string, or nested conditions
 * @returns the resolved relative path, or `undefined` if no usable condition was found
 */
function pickJsCondition(entry: unknown): string | undefined {
  if (typeof entry === 'string') {
    return entry;
  }
  if (typeof entry !== 'object' || entry === null) {
    return undefined;
  }
  const conditions = entry as Record<string, unknown>;
  for (const key of ['import', 'require', 'node', 'default']) {
    if (key in conditions) {
      const picked = pickJsCondition(conditions[key]);
      if (picked) {
        return picked;
      }
    }
  }
  return undefined;
}

/**
 * Reads and parses `filePath` as JS, with parent nodes set - unlike `tsGetSourceFile`, which
 * never triggers binding, so `.parent` stays unset and `node.getSourceFile()` returns `undefined`.
 * @param config the current Stencil validated config
 * @param filePath the absolute path of the JS file to read and parse
 * @returns the parsed source file, or `undefined` if it couldn't be read
 */
function readJsSourceFile(config: d.ValidatedConfig, filePath: string): ts.SourceFile | undefined {
  try {
    const text = config.sys.readFileSync(filePath);
    if (typeof text !== 'string') {
      return undefined;
    }
    return ts.createSourceFile(filePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  } catch {
    return undefined;
  }
}

/**
 * Resolves the runtime JS entry for a bare (non-relative) module specifier by reading its
 * package's own `package.json` `exports` map, instead of `tsResolveModuleName` - which always
 * resolves to the package's `types` entry, an ambient signature with no body a mixin factory's
 * class can never be found inside.
 * @param config the current Stencil validated config
 * @param compilerCtx the current compiler context
 * @param moduleSpecifier the bare package specifier to resolve
 * @param containingFile the file the specifier was imported from
 * @returns the resolved JS source file, or `undefined` if it couldn't be resolved this way
 */
export function resolveModuleJsEntry(
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  moduleSpecifier: string,
  containingFile: string,
): ts.SourceFile | undefined {
  if (isLocalModule(moduleSpecifier)) {
    // relative/absolute specifiers already resolve to real project source
    return undefined;
  }

  const pkgJsonPath = tsResolveModuleNamePackageJsonPath(
    config,
    compilerCtx,
    moduleSpecifier,
    containingFile,
  );
  if (!pkgJsonPath) {
    return undefined;
  }

  let pkgJson: { name?: string; exports?: unknown };
  try {
    pkgJson = JSON.parse(config.sys.readFileSync(pkgJsonPath));
  } catch {
    return undefined;
  }

  const pkgName = pkgJson.name;
  if (!pkgName || !moduleSpecifier.startsWith(pkgName) || !pkgJson.exports) {
    return undefined;
  }

  const subpath = moduleSpecifier === pkgName ? '.' : `.${moduleSpecifier.slice(pkgName.length)}`;
  const exportsMap = pkgJson.exports as Record<string, unknown> | string;
  const conditionEntry =
    typeof exportsMap === 'string'
      ? subpath === '.'
        ? exportsMap
        : undefined
      : (exportsMap[subpath] ?? (subpath === '.' ? exportsMap : undefined));
  const target = conditionEntry && pickJsCondition(conditionEntry);
  if (!target) {
    return undefined;
  }

  return readJsSourceFile(config, normalizePath(join(dirname(pkgJsonPath), target)));
}

/**
 * Finds `className`'s class inside a resolved JS entry (see `resolveModuleJsEntry`), following
 * re-export hops the same way `resolveAndProcessExtendedClass` walks a `.d.ts`/`.ts` source.
 * @param config the current Stencil validated config
 * @param compilerCtx the current compiler context
 * @param source the JS source file to search
 * @param className the class (or mixin factory) name to look for
 * @param hopsRemaining re-export hops still allowed before giving up
 * @returns the found class and the source file it's declared in, or `undefined`
 */
export function findClassInJsModule(
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  source: ts.SourceFile,
  className: string,
  hopsRemaining = 3,
): { classNode: ts.ClassLikeDeclaration; sourceFile: ts.SourceFile } | undefined {
  const matchedStatement = findStatementByName(source, className);
  if (matchedStatement) {
    const classNode = ts.isClassDeclaration(matchedStatement)
      ? matchedStatement
      : findClassWalk(matchedStatement);
    return classNode && { classNode, sourceFile: source };
  }
  if (hopsRemaining <= 0) {
    return undefined;
  }
  const reExport = findReExport(source, className);
  if (!reExport) {
    return undefined;
  }
  const resolvedModule = tsResolveModuleName(
    config,
    compilerCtx,
    reExport.moduleSpecifier,
    source.fileName,
  );
  const resolvedFileName = resolvedModule?.resolvedModule?.resolvedFileName;
  const nextSource = resolvedFileName && readJsSourceFile(config, resolvedFileName);
  if (!nextSource) {
    return undefined;
  }
  return findClassInJsModule(
    config,
    compilerCtx,
    nextSource,
    reExport.localName,
    hopsRemaining - 1,
  );
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
