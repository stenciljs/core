import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildWarn } from '../../../../utils';
import { convertDecoratorsToStatic } from '../../decorators-to-static/convert-decorators';
import { isStaticGetter } from '../../transform-utils';
import { parseStaticEvents } from '../events';
import { parseStaticListeners } from '../listeners';
import { parseStaticMethods } from '../methods';
import { parseStaticProps } from '../props';
import { parseStaticStates } from '../states';
import { parseStaticWatchers } from '../watchers';
import { extractInheritedMetaFromClass } from './extract-inherited-meta';
import {
  deDupeMembers,
  findClassWalk,
  findReExport,
  matchesNamedDeclaration,
  reanchorInheritedTypeReferences,
  warnMixinFactoryClassNotFound,
} from './shared';

// Alternative to the TypeChecker-backed inheritance walk in compiler-ctx-merge.ts,
// for the stateless `transpile()`/`transpileAsync()` path where there's no
// CompilerCtx, no moduleMap, and no TypeScript program - only source text.
// A caller-supplied `resolveImport` callback maps an import specifier to
// source code; each ancestor file is parsed on the fly and merged in.

type ResolveImport = (specifier: string, importer: string) => { code: string; path: string } | null;

/**
 * Same purpose as `convertDiskSourceFileDecorators` in compiler-ctx-merge.ts,
 * but serves the already-parsed in-memory source directly instead of
 * re-reading it from disk - the parent source here comes from a
 * caller-supplied `resolveImport` callback and isn't guaranteed to
 * correspond to a real file on disk.
 * @param sourceFile the raw (decorator-syntax) parent source file, already parsed
 * @param config the current Stencil validated config
 * @returns the source converted to static-getter form, or `null` if the mini-program transform fails
 */
function convertInMemorySourceDecorators(
  sourceFile: ts.SourceFile,
  config: d.ValidatedConfig,
): ts.SourceFile | null {
  const compilerOptions: ts.CompilerOptions = {
    ...config.tsCompilerOptions,
    experimentalDecorators: true,
    noLib: true,
    noResolve: true,
    isolatedModules: false,
    target: sourceFile.languageVersion,
  };
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => (fileName === sourceFile.fileName ? sourceFile : undefined),
    writeFile: () => {},
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '',
    getNewLine: () => '\n',
    fileExists: (fileName) => fileName === sourceFile.fileName,
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => [],
  };
  try {
    const program = ts.createProgram([sourceFile.fileName], compilerOptions, compilerHost);
    const typeChecker = program.getTypeChecker();
    const ownSourceFile = program.getSourceFile(sourceFile.fileName) ?? sourceFile;
    const result = ts.transform(ownSourceFile, [
      convertDecoratorsToStatic(config, [], typeChecker, program),
    ]);
    const printer = ts.createPrinter({ removeComments: false });
    const printed = printer.printFile(result.transformed[0]);
    const scriptKind =
      sourceFile.fileName.endsWith('.tsx') || sourceFile.fileName.endsWith('.ts')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.JS;
    return ts.createSourceFile(
      sourceFile.fileName,
      printed,
      sourceFile.languageVersion,
      true,
      scriptKind,
    );
  } catch {
    return null;
  }
}

/**
 * Reads the name(s) a class declaration extends from - either a single
 * identifier (`extends Foo`) or, for the mixin composition pattern, each
 * mixin factory argument (`extends Mixin(A, B)` > `['A', 'B']`).
 *
 * @param node the class declaration to inspect
 * @returns the extended identifier names, or an empty array if the class
 * doesn't extend anything recognizable
 */
function getExtendsClassNames(node: ts.ClassDeclaration): string[] {
  const heritage = node.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ExtendsKeyword);
  if (!heritage?.types.length) return [];
  const expr = heritage.types[0].expression;
  if (ts.isIdentifier(expr)) return [expr.text];
  if (ts.isCallExpression(expr) && expr.expression.getText() === 'Mixin') {
    return expr.arguments.filter(ts.isIdentifier).map((id) => id.text);
  }
  return [];
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
 * A single-file mini-program (see `convertInMemorySourceDecorators`) can
 * never load an imported module's own `SourceFile`, so a type that's
 * genuinely imported still ends up classified `location: 'global'`
 *
 * This reclassifies those cases using the same syntactic import lookup used
 * to walk the extends chain: if the type name matches something imported in
 * the file that declares it, it's an import, not a global, regardless of
 * whether the mini-program could load that file - downstream consumers
 * (e.g. `@stencil/unplugin`'s own type expansion) resolve `path` themselves.
 *
 * @param members inherited members whose type references should be reclassified
 * @param declaringSf the source file that declares these members
 * @param declaringPath the resolved absolute path of `declaringSf`
 * @param resolveImport callback used to resolve a canonical id for the reclassified reference
 * @returns the same members, with `global` references reclassified where possible
 */
function reclassifyGlobalTypeReferences<
  T extends d.ComponentCompilerProperty | d.ComponentCompilerEvent | d.ComponentCompilerMethod,
>(
  members: T[],
  declaringSf: ts.SourceFile,
  declaringPath: string,
  resolveImport: ResolveImport,
): T[] {
  members.forEach((member) => {
    const references = member.complexType?.references;
    if (!references) {
      return;
    }
    Object.entries(references).forEach(([typeName, reference]) => {
      if (reference.location !== 'global') {
        return;
      }
      const specifier = findImportSpecifier(declaringSf, typeName);
      if (!specifier) {
        return;
      }
      const resolved = resolveImport(specifier, declaringPath);
      reference.location = 'import';
      reference.path = specifier;
      reference.id = `${resolved?.path ?? specifier}::${typeName}`;
    });
  });
  return members;
}

type AncestorEntry = {
  classNode: ts.ClassDeclaration;
  sourceFile: ts.SourceFile;
  path: string;
};

/**
 * Looks for `name` as a direct top-level declaration in `sf`; if not found, follows one level of
 * re-export (barrel file) via `resolveImport` - matching `compiler-ctx-merge.ts`'s equivalent
 * one-hop fallback (see `findReExport` in `shared.ts` for why it's capped at one hop).
 *
 * @param sf the source file to search
 * @param path the resolved absolute path of `sf`
 * @param name the declaration name to find
 * @param resolveImport callback used to follow a re-export's module specifier
 * @returns the matched statement and the source file/path it was actually found in (which may
 * differ from `sf`/`path` if resolved through a re-export), or `undefined`
 */
function findDeclarationOrReExport(
  sf: ts.SourceFile,
  path: string,
  name: string,
  resolveImport: ResolveImport,
):
  | {
      statement: ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement;
      sourceFile: ts.SourceFile;
      path: string;
    }
  | undefined {
  const direct = sf.statements.find(matchesNamedDeclaration(name));
  if (direct) return { statement: direct, sourceFile: sf, path };

  const reExport = findReExport(sf, name);
  if (!reExport) return undefined;

  const resolved = resolveImport(reExport.moduleSpecifier, path);
  if (!resolved) return undefined;

  const { code, path: resolvedPath } = resolved;
  const isTs = resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.ts');
  const reExportSf = ts.createSourceFile(
    resolvedPath,
    code,
    ts.ScriptTarget.ESNext,
    true,
    isTs ? ts.ScriptKind.TSX : ts.ScriptKind.JS,
  );
  const statement = reExportSf.statements.find(matchesNamedDeclaration(reExport.localName));
  if (!statement) return undefined;

  return { statement, sourceFile: reExportSf, path: resolvedPath };
}

/**
 * Recursively resolves a class's `extends` heritage into a flat, deduplicated
 * list of ancestor classes, using `resolveImport` (and same-file lookups)
 * instead of a TypeChecker - the `resolveImport`-callback equivalent of
 * `compiler-ctx-merge.ts`'s `buildExtendsTree`. Handles both a plain
 * `extends Foo` and `extends Mixin(A, B, ...)`, resolving each mixin
 * argument independently.
 *
 * A found ancestor that's wrapped in a mixin factory function (rather than a
 * plain class) stops that branch's recursion - the factory's own `extends`
 * target is a dynamic parameter (e.g. `Base`), not a statically resolvable
 * name.
 * @param classNode the class declaration whose heritage should be walked
 * @param sf the source file containing `classNode` (for import/statement lookups)
 * @param path the resolved absolute path of `sf`
 * @param resolveImport callback that resolves an import specifier to source code
 * @param visited cycle guard, keyed by `resolvedPath::name`
 * @param ancestors the flat array to accumulate found ancestors into
 * @param rootClassDeclaration the top-level component class, used to anchor any "not found" warning
 * @param buildCtx used to surface a warning when an imported extends/mixin target can't be found -
 * omit to resolve silently (e.g. from tests that don't care about diagnostics)
 */
function resolveAncestors(
  classNode: ts.ClassDeclaration,
  sf: ts.SourceFile,
  path: string,
  resolveImport: ResolveImport,
  visited: Set<string>,
  ancestors: AncestorEntry[],
  rootClassDeclaration: ts.ClassDeclaration,
  buildCtx?: d.BuildCtx,
): void {
  const parentNames = getExtendsClassNames(classNode);

  for (const parentName of parentNames) {
    let foundClass: ts.ClassDeclaration | undefined;
    let foundSf = sf;
    let foundPath = path;
    let keepLooking = true;

    const sameFileStatement = sf.statements.find(matchesNamedDeclaration(parentName));
    if (sameFileStatement) {
      if (ts.isClassDeclaration(sameFileStatement)) {
        foundClass = sameFileStatement;
      } else {
        // wrapped in a function (mixin factory) - can't recurse further
        foundClass = findClassWalk(sameFileStatement);
        keepLooking = false;
        if (!foundClass) {
          warnMixinFactoryClassNotFound(buildCtx, parentName, rootClassDeclaration);
        }
      }
    } else {
      const specifier = findImportSpecifier(sf, parentName);
      if (!specifier) continue;

      const resolved = resolveImport(specifier, path);
      if (!resolved) continue;

      const { code, path: resolvedPath } = resolved;
      const visitKey = `${resolvedPath}::${parentName}`;
      if (visited.has(visitKey)) continue; // cycle guard
      visited.add(visitKey);

      const isTs = resolvedPath.endsWith('.tsx') || resolvedPath.endsWith('.ts');
      const parentSf = ts.createSourceFile(
        resolvedPath,
        code,
        ts.ScriptTarget.ESNext,
        true,
        isTs ? ts.ScriptKind.TSX : ts.ScriptKind.JS,
      );

      const found = findDeclarationOrReExport(parentSf, resolvedPath, parentName, resolveImport);
      if (!found) {
        // we couldn't find the imported declaration as an exported statement in the module
        if (buildCtx) {
          const err = buildWarn(buildCtx.diagnostics);
          err.messageText = `Unable to find "${parentName}" in the imported module "${specifier}".
                        Please import class / mixin-factory declarations directly and not via barrel files.`;
          if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, rootClassDeclaration);
        }
        continue;
      }

      foundSf = found.sourceFile;
      foundPath = found.path;

      if (ts.isClassDeclaration(found.statement)) {
        foundClass = found.statement;
      } else {
        // wrapped in a function (mixin factory) - can't recurse further
        foundClass = findClassWalk(found.statement);
        keepLooking = false;
        if (!foundClass) {
          warnMixinFactoryClassNotFound(buildCtx, parentName, rootClassDeclaration);
        }
      }
    }

    if (!foundClass || ancestors.some((a) => a.classNode === foundClass)) continue;

    ancestors.push({ classNode: foundClass, sourceFile: foundSf, path: foundPath });

    if (keepLooking) {
      resolveAncestors(
        foundClass,
        foundSf,
        foundPath,
        resolveImport,
        visited,
        ancestors,
        rootClassDeclaration,
        buildCtx,
      );
    }
  }
}

type AncestorMeta = {
  properties: d.ComponentCompilerProperty[];
  states: d.ComponentCompilerState[];
  methods: d.ComponentCompilerMethod[];
  events: d.ComponentCompilerEvent[];
  listeners: d.ComponentCompilerListener[];
  watchers: d.ComponentCompilerChangeHandler[];
  methodNames: string[];
};

/**
 * Extracts Stencil member metadata for a single resolved ancestor - static
 * getter form, or decorator syntax run through a throwaway single-file
 * program so real `complexType` info is computed, falling back to the
 * type-blind `extractInheritedMetaFromClass` walk if that program fails.
 * @param ancestor the resolved ancestor to extract metadata from
 * @param cmpSourceFile the extending component's source file (re-anchor target)
 * @param resolveImport callback that resolves an import specifier to source code
 * @param config used to compute real `complexType` info via a mini `ts.Program`
 * @returns the ancestor's metadata
 */
function extractAncestorMeta(
  ancestor: AncestorEntry,
  cmpSourceFile: ts.SourceFile,
  resolveImport: ResolveImport,
  config: d.ValidatedConfig,
): AncestorMeta {
  const { classNode, sourceFile: parentSf, path: resolvedPath } = ancestor;
  const className = classNode.name?.text;

  const parentStaticMembers = classNode.members.filter(isStaticGetter) as ts.ClassElement[];
  let resolvedClassNode = classNode;
  let resolvedStaticMembers = parentStaticMembers;
  let hasUsableStaticMembers = parentStaticMembers.some(
    (m) =>
      ts.isGetAccessorDeclaration(m) &&
      ts.isIdentifier(m.name) &&
      ['properties', 'states', 'events', 'listeners', 'watchers', 'methods'].includes(m.name.text),
  );

  if (!hasUsableStaticMembers && className) {
    // decorator syntax: run it through a throwaway single-file program so
    // real complexType info is computed the same way as for any other
    // Stencil class, instead of falling back to extractInheritedMetaFromClass's
    // type-blind walk. `className` is the resolved (possibly nested) class's
    // own name, not necessarily the mixin-factory identifier it was found
    // through - findClassWalk needs it to disambiguate from other classes in
    // the same converted file.
    const converted = convertInMemorySourceDecorators(parentSf, config);
    const convertedClass = converted && findClassWalk(converted, className);
    if (convertedClass) {
      resolvedClassNode = convertedClass;
      resolvedStaticMembers = convertedClass.members.filter(isStaticGetter) as ts.ClassElement[];
      hasUsableStaticMembers = true;
    }
  }

  // falls back to the cheaper syntactic walk only if the mini-program
  // conversion above didn't run (ancestor already had static getters) or failed
  if (!hasUsableStaticMembers) {
    return extractInheritedMetaFromClass(classNode);
  }

  return {
    properties: reanchorInheritedTypeReferences(
      reclassifyGlobalTypeReferences(
        parseStaticProps(resolvedStaticMembers) ?? [],
        parentSf,
        resolvedPath,
        resolveImport,
      ),
      resolvedPath,
      cmpSourceFile.fileName,
    ),
    states: parseStaticStates(resolvedStaticMembers) ?? [],
    methods: reanchorInheritedTypeReferences(
      reclassifyGlobalTypeReferences(
        parseStaticMethods(resolvedStaticMembers) ?? [],
        parentSf,
        resolvedPath,
        resolveImport,
      ),
      resolvedPath,
      cmpSourceFile.fileName,
    ),
    events: reanchorInheritedTypeReferences(
      reclassifyGlobalTypeReferences(
        parseStaticEvents(resolvedStaticMembers) ?? [],
        parentSf,
        resolvedPath,
        resolveImport,
      ),
      resolvedPath,
      cmpSourceFile.fileName,
    ),
    listeners: parseStaticListeners(resolvedStaticMembers) ?? [],
    watchers: parseStaticWatchers(resolvedStaticMembers) ?? [],
    methodNames: resolvedClassNode.members
      .filter(ts.isMethodDeclaration)
      .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
      .filter(Boolean),
  };
}

/**
 * Resolves the inheritance chain for a component using a caller-supplied
 * `resolveImport` callback instead of the full compiler infrastructure -
 * safe to call from `transpileSync`/`transpileAsync` (no TypeChecker needed).
 * Handles both a plain `extends Foo` and the mixin composition pattern
 * (`extends Mixin(A, B, ...)`).
 *
 * @param cmpNode the component's class declaration
 * @param staticMembers static getter members already parsed from the component
 * @param sourceFile the source file containing the component (for import resolution)
 * @param resolveImport callback that resolves an import specifier to source code
 * @param config used to compute real `complexType` info for decorator-syntax
 * parent classes via a mini `ts.Program`
 * @param buildCtx used to surface a warning when an imported extends/mixin target can't be
 * found - optional so existing (non-diagnostic-checking) callers aren't forced to supply one
 * @returns merged metadata including all inherited members
 */
export function mergeExtendedClassMetaWithResolveImport(
  cmpNode: ts.ClassDeclaration,
  staticMembers: ts.ClassElement[],
  sourceFile: ts.SourceFile,
  resolveImport: ResolveImport,
  config: d.ValidatedConfig,
  buildCtx?: d.BuildCtx,
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

  const ancestors: AncestorEntry[] = [];
  resolveAncestors(
    cmpNode,
    sourceFile,
    sourceFile.fileName,
    resolveImport,
    new Set(),
    ancestors,
    cmpNode,
    buildCtx,
  );

  ancestors.forEach((ancestor) => {
    const parentMeta = extractAncestorMeta(ancestor, sourceFile, resolveImport, config);

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
  });

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
