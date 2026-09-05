import ts from 'typescript';
import type * as d from '@stencil/core';

import { toDashCase } from '../../../../utils';
import { isStaticGetter } from '../../transform-utils';
import { parseStaticEvents } from '../events';
import { parseStaticListeners } from '../listeners';
import { parseStaticMethods } from '../methods';
import { parseStaticProps } from '../props';
import { parseStaticStates } from '../states';
import { parseStaticWatchers } from '../watchers';

// resolve-import-merge.ts's last-resort fallback for a parent class it can't
// run through a mini `ts.Program` (see `convertInMemorySourceDecorators`) -
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

  return extractInheritedMetaFromClass(classDecl);
}

/**
 * Same as {@link extractInheritedMeta}, but takes an already-parsed class
 * declaration directly - used for ancestors reached via `findClassWalk`
 * (e.g. a mixin factory's nested class, or a same-file ancestor), where
 * there's no standalone source text to re-parse.
 * @param classDecl the class declaration to extract metadata from
 * @returns extracted metadata
 */
export function extractInheritedMetaFromClass(
  classDecl: ts.ClassDeclaration,
): ExtractedInheritedMeta {
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
