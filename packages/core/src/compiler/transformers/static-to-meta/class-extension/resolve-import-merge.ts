import ts from 'typescript';
import type * as d from '@stencil/core';

import { toDashCase } from '../../../../utils';
import { convertDecoratorsToStatic } from '../../decorators-to-static/convert-decorators';
import { isStaticGetter } from '../../transform-utils';
import { parseStaticEvents } from '../events';
import { parseStaticListeners } from '../listeners';
import { parseStaticMethods } from '../methods';
import { parseStaticProps } from '../props';
import { parseStaticStates } from '../states';
import { parseStaticWatchers } from '../watchers';
import { deDupeMembers, reanchorInheritedTypeReferences } from './shared';

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
 * A single-file mini-program (see `convertInMemorySourceDecorators`) can
 * never load an imported module's own `SourceFile`, so a type that's
 * genuinely imported still ends up classified `location: 'global'` there.
 * This reclassifies those cases using the same syntactic import lookup used
 * to walk the extends chain: if the type name matches something imported in
 * the file that declares it, it's an import, not a global, regardless of
 * whether the mini-program could load that file - downstream consumers
 * (e.g. `@stencil/unplugin`'s own type expansion) resolve `path` themselves.
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

/**
 * Resolves the inheritance chain for a component using a caller-supplied
 * `resolveImport` callback instead of the full compiler infrastructure -
 * safe to call from `transpileSync`/`transpileAsync` (no TypeChecker needed).
 * @param cmpNode the component's class declaration
 * @param staticMembers static getter members already parsed from the component
 * @param sourceFile the source file containing the component (for import resolution)
 * @param resolveImport callback that resolves an import specifier to source code
 * @param config used to compute real `complexType` info for decorator-syntax
 * parent classes via a mini `ts.Program`
 * @returns merged metadata including all inherited members
 */
export function mergeExtendedClassMetaWithResolveImport(
  cmpNode: ts.ClassDeclaration,
  staticMembers: ts.ClassElement[],
  sourceFile: ts.SourceFile,
  resolveImport: ResolveImport,
  config: d.ValidatedConfig,
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

    // parse once; reuse for both meta extraction and the next-level extends walk
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
    let resolvedClassNode = parentClass;
    let resolvedStaticMembers = parentStaticMembers;
    let hasUsableStaticMembers = parentStaticMembers.some(
      (m) =>
        ts.isGetAccessorDeclaration(m) &&
        ts.isIdentifier(m.name) &&
        ['properties', 'states', 'events', 'listeners', 'watchers', 'methods'].includes(
          m.name.text,
        ),
    );

    if (!hasUsableStaticMembers) {
      // decorator syntax: run it through a throwaway single-file program so
      // real complexType info is computed the same way as for any other
      // Stencil class, instead of falling back to extractInheritedMeta's
      // type-blind walk
      const converted = convertInMemorySourceDecorators(parentSf, config);
      const convertedClass = converted?.statements
        .filter(ts.isClassDeclaration)
        .find((c) => c.name?.text === parentClassName);
      if (convertedClass) {
        resolvedClassNode = convertedClass;
        resolvedStaticMembers = convertedClass.members.filter(isStaticGetter) as ts.ClassElement[];
        hasUsableStaticMembers = true;
      }
    }

    // falls back to the cheaper syntactic walk only if the mini-program
    // conversion above didn't run (parent already had static getters) or failed
    const parentMeta = hasUsableStaticMembers
      ? {
          properties: reanchorInheritedTypeReferences(
            reclassifyGlobalTypeReferences(
              parseStaticProps(resolvedStaticMembers) ?? [],
              parentSf,
              resolvedPath,
              resolveImport,
            ),
            resolvedPath,
            sourceFile.fileName,
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
            sourceFile.fileName,
          ),
          events: reanchorInheritedTypeReferences(
            reclassifyGlobalTypeReferences(
              parseStaticEvents(resolvedStaticMembers) ?? [],
              parentSf,
              resolvedPath,
              resolveImport,
            ),
            resolvedPath,
            sourceFile.fileName,
          ),
          listeners: parseStaticListeners(resolvedStaticMembers) ?? [],
          watchers: parseStaticWatchers(resolvedStaticMembers) ?? [],
          methodNames: resolvedClassNode.members
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

// extractInheritedMeta is mergeExtendedClassMetaWithResolveImport's fallback
// for a parent class it can't run through convertInMemorySourceDecorators -
// parse-only (no Program, no TypeChecker), so every type comes back `any`.

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
 * Extracts Stencil member metadata from source text using parse-only
 * TypeScript (no Program, no TypeChecker) - handles both decorator syntax
 * (`.tsx` source files) and compiled static-getter syntax (`.js` collection
 * files).
 *
 * @param code source text to parse
 * @param className name of the class to extract metadata from
 * @param fileName virtual filename used to determine script kind
 * @returns extracted metadata, or `null` if the named class isn't found
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

  // detect compiled static getter form (collection .js files) - purely
  // syntactic, so it works on parse-only AST nodes
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

  // decorator syntax: walk class members and extract directly from the AST
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
