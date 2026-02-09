import type * as d from '@stencil/core';
import ts from 'typescript';

/**
 * Create a binding for an `ElementInternals` object compatible with a 'native'
 * component (i.e. one which extends `HTMLElement` and is distributed as a
 * standalone custom element).
 *
 * Since a 'native' custom element will extend `HTMLElement` we can call
 * `this.attachInternals` directly, binding it to the name annotated by the
 * developer with the `@AttachInternals` decorator.
 *
 * Thus if an `@AttachInternals` decorator is present on a component like
 * this:
 *
 * ```ts
 * @AttachInternals({ states: { open: true, active: false } })
 * internals: ElementInternals;
 * ```
 *
 * then this transformer will emit TS syntax nodes representing the
 * following TypeScript source code:
 *
 * ```ts
 * this.internals = this.attachInternals();
 * this.internals.states.add('open');
 * // 'active' is false, so no call needed (not in set by default)
 * ```
 *
 * @param cmp metadata about the component of interest, gathered during
 * compilation
 * @returns an expression statement syntax tree node
 */
export function createNativeAttachInternalsBinding(cmp: d.ComponentCompilerMeta): ts.ExpressionStatement[] {
  if (!cmp.attachInternalsMemberName) {
    return [];
  }

  const statements: ts.ExpressionStatement[] = [
    ts.factory.createExpressionStatement(
      ts.factory.createBinaryExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createThis(),
          // use the name set on the {@link d.ComponentCompilerMeta}
          ts.factory.createIdentifier(cmp.attachInternalsMemberName),
        ),
        ts.factory.createToken(ts.SyntaxKind.EqualsToken),
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createThis(),
            ts.factory.createIdentifier('attachInternals'),
          ),
          undefined,
          [],
        ),
      ),
    ),
  ];

  // Add custom states initialization for states with initialValue: true
  // CustomStateSet only has add/delete/has methods (extends Set), so we only
  // need to call add() for true values - false values are the default (not in set)
  if (cmp.attachInternalsCustomStates?.length > 0) {
    for (const customState of cmp.attachInternalsCustomStates) {
      if (customState.initialValue) {
        statements.push(createStatesAddCall(cmp.attachInternalsMemberName, customState.name));
      }
    }
  }

  return statements;
}

/**
 * Create a `states.add()` call for initializing a custom state.
 *
 * Generates code like:
 * ```ts
 * this.internals.states.add('stateName');
 * ```
 *
 * @param memberName the name of the ElementInternals property
 * @param stateName the name of the custom state to add
 * @returns an expression statement for the add call
 */
function createStatesAddCall(memberName: string, stateName: string): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier(memberName)),
          ts.factory.createIdentifier('states'),
        ),
        ts.factory.createIdentifier('add'),
      ),
      undefined,
      [ts.factory.createStringLiteral(stateName)],
    ),
  );
}
