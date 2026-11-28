import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildError } from '../../../utils';
import { retrieveTsDecorators } from '../transform-utils';
import { isDecoratorNamed } from './decorator-utils';
import type { StencilDecorator } from './decorators-constants';
import type { ImportAliasMap } from './import-alias-map';

/** Decorators whose member may have a computed name that resolves to a literal at compile time. */
const RESOLVED_COMPUTED_NAME: readonly StencilDecorator[] = ['Prop', 'State', 'AttachInternals'];
/** Decorators whose member must have a plain name. */
const NO_COMPUTED_NAME: readonly StencilDecorator[] = [
  'Element',
  'Event',
  'Listen',
  'Method',
  'Watch',
];

/**
 * Reports Stencil-decorated members whose computed name Stencil can't use.
 * @param diagnostics for surfacing errors
 * @param typeChecker used to resolve a computed name to a literal
 * @param decoratedMembers the class's decorated members
 * @param importAliasMap local names of the Stencil decorators
 */
export const validateComputedMemberNames = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  decoratedMembers: ts.ClassElement[],
  importAliasMap: ImportAliasMap,
) => {
  for (const member of decoratedMembers) {
    const name = member.name;
    if (!name || !ts.isComputedPropertyName(name)) continue;

    const decorators = retrieveTsDecorators(member) ?? [];
    const uses = (list: readonly StencilDecorator[]) =>
      list.find((dec) => decorators.some(isDecoratorNamed(importAliasMap.get(dec))));

    const unsupported = uses(NO_COMPUTED_NAME);
    if (unsupported) {
      const err = buildError(diagnostics);
      err.messageText = `@${unsupported}() does not support a computed member name (\`${name.getText()}\`). Use a plain name.`;
      augmentDiagnosticWithNode(err, name);
      continue;
    }

    const resolved = uses(RESOLVED_COMPUTED_NAME);
    if (resolved && !typeChecker.getTypeAtLocation(name.expression)?.isLiteral()) {
      const err = buildError(diagnostics);
      err.messageText = `The computed name \`${name.getText()}\` of this @${resolved}() can't be resolved at compile time. Use a \`const\` string or enum member.`;
      augmentDiagnosticWithNode(err, name);
    }
  }
};
