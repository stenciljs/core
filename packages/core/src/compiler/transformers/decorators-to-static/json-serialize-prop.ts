import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildError } from '../../../utils';
import { STENCIL_CORE_ID } from '../../bundle/entry-alias-ids';
import { retrieveTsDecorators, tsPropDeclName } from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

/**
 * `@Prop({ serialize: 'json' })` is shorthand for a `@PropSerialize()` / `@AttrDeserialize()` pair
 * that writes the value to the prop's attribute as JSON on the server, and reads it back in the
 * browser. These are the generated methods' names (no leading `_`: the runtime metadata drops
 * those keys), and the alias of the `Build` import they use.
 */
export const JSON_SERIALIZE_METHOD = 'stencilSerializeJson';
export const JSON_DESERIALIZE_METHOD = 'stencilDeserializeJson';
const BUILD_ALIAS = '__stencil_Build';

/**
 * Find the props declared `@Prop({ serialize: 'json' })`, reporting invalid combinations.
 * @param diagnostics for surfacing errors
 * @param typeChecker a TypeScript typechecker instance
 * @param decoratedMembers the class's decorated members
 * @param propDecoratorName the name `@Prop` is imported as
 * @param handWritten serializers and deserializers written with the decorators
 * @returns the names of the props to serialize as JSON
 */
export const getJsonSerializedProps = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  decoratedMembers: ts.ClassElement[],
  propDecoratorName: string,
  handWritten: d.ComponentCompilerChangeHandler[],
): string[] =>
  decoratedMembers.flatMap((member) => {
    if (!ts.isPropertyDeclaration(member) && !ts.isGetAccessor(member)) return [];
    const decorator = retrieveTsDecorators(member)?.find(isDecoratorNamed(propDecoratorName));
    if (!decorator) return [];

    const [options] = getDecoratorParameters<d.PropOptions>(decorator, typeChecker);
    if (options?.serialize == null) return [];

    const { staticName: propName } = tsPropDeclName(member, typeChecker);
    const error = (messageText: string) => {
      const err = buildError(diagnostics);
      err.messageText = messageText;
      augmentDiagnosticWithNode(err, decorator);
    };

    if (options.serialize !== 'json') {
      error(
        `@Prop({ serialize }) on "${propName}" must be 'json'. For other formats, use @PropSerialize() and @AttrDeserialize().`,
      );
      return [];
    }
    if (options.attribute === null) {
      error(
        `@Prop({ serialize: 'json' }) on "${propName}" needs an attribute to write to, but it has "attribute: null".`,
      );
      return [];
    }
    if (handWritten.some((h) => h.propName === propName)) {
      error(
        `"${propName}" has both @Prop({ serialize: 'json' }) and its own @PropSerialize() / @AttrDeserialize(). Use one or the other.`,
      );
      return [];
    }
    return [propName];
  });

/**
 * The methods `@Prop({ serialize: 'json' })` uses, shared by every such prop in a class:
 *
 * ```ts
 * stencilSerializeJson(value) {
 *   return __stencil_Build.isServer ? JSON.stringify(value) : null;
 * }
 * stencilDeserializeJson(value, propName) {
 *   try {
 *     return JSON.parse(value);
 *   } catch {
 *     if (__stencil_Build.isDev) console.warn(...);
 *     // leave the prop as it is
 *     return __stencil_Build.isServer ? undefined : this[propName];
 *   }
 * }
 * ```
 *
 * The serializer only writes on the server, like a hand-written one should: in the browser the
 * attribute's job is done, and rewriting it on every change would be wasted work.
 * @returns the two method declarations
 */
export const createJsonSerializerMethods = (): ts.MethodDeclaration[] => {
  const f = ts.factory;
  const build = (flag: string) =>
    f.createPropertyAccessExpression(f.createIdentifier(BUILD_ALIAS), flag);
  const jsonCall = (method: string, arg: ts.Expression) =>
    f.createCallExpression(
      f.createPropertyAccessExpression(f.createIdentifier('JSON'), method),
      undefined,
      [arg],
    );
  const param = (name: string) => f.createParameterDeclaration(undefined, undefined, name);
  const method = (name: string, params: string[], body: ts.Statement[]) =>
    f.createMethodDeclaration(
      undefined,
      undefined,
      name,
      undefined,
      undefined,
      params.map(param),
      undefined,
      f.createBlock(body, true),
    );

  const serialize = method(
    JSON_SERIALIZE_METHOD,
    ['value'],
    [
      f.createReturnStatement(
        f.createConditionalExpression(
          build('isServer'),
          undefined,
          jsonCall('stringify', f.createIdentifier('value')),
          undefined,
          f.createNull(),
        ),
      ),
    ],
  );

  const warn = f.createIfStatement(
    build('isDev'),
    f.createExpressionStatement(
      f.createCallExpression(
        f.createPropertyAccessExpression(f.createIdentifier('console'), 'warn'),
        undefined,
        [
          f.createTemplateExpression(f.createTemplateHead('The "'), [
            f.createTemplateSpan(
              f.createIdentifier('propName'),
              f.createTemplateMiddle(
                `" attribute isn't valid JSON, so the prop was left as it is: `,
              ),
            ),
            f.createTemplateSpan(f.createIdentifier('value'), f.createTemplateTail('')),
          ]),
        ],
      ),
    ),
  );
  const deserialize = method(
    JSON_DESERIALIZE_METHOD,
    ['value', 'propName'],
    [
      f.createTryStatement(
        f.createBlock(
          [f.createReturnStatement(jsonCall('parse', f.createIdentifier('value')))],
          true,
        ),
        f.createCatchClause(
          undefined,
          f.createBlock(
            [
              warn,
              f.createReturnStatement(
                f.createConditionalExpression(
                  build('isServer'),
                  undefined,
                  f.createIdentifier('undefined'),
                  undefined,
                  f.createElementAccessExpression(f.createThis(), f.createIdentifier('propName')),
                ),
              ),
            ],
            true,
          ),
        ),
        undefined,
      ),
    ],
  );

  return [serialize, deserialize];
};

/**
 * Import `Build` (as {@link BUILD_ALIAS}) from `@stencil/core`, for the generated methods. Added
 * to an existing `@stencil/core` import, which a component's source always has.
 * @param sourceFile the source file
 * @returns the source file with the import
 */
export const addBuildImport = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const f = ts.factory;
  const specifier = f.createImportSpecifier(
    false,
    f.createIdentifier('Build'),
    f.createIdentifier(BUILD_ALIAS),
  );

  let added = false;
  const statements = sourceFile.statements.map((s) => {
    if (
      added ||
      !ts.isImportDeclaration(s) ||
      !ts.isStringLiteral(s.moduleSpecifier) ||
      s.moduleSpecifier.text !== STENCIL_CORE_ID ||
      !s.importClause?.namedBindings ||
      !ts.isNamedImports(s.importClause.namedBindings) ||
      s.importClause.isTypeOnly
    ) {
      return s;
    }
    added = true;
    return f.updateImportDeclaration(
      s,
      s.modifiers,
      f.updateImportClause(
        s.importClause,
        false,
        s.importClause.name,
        f.updateNamedImports(s.importClause.namedBindings, [
          ...s.importClause.namedBindings.elements,
          specifier,
        ]),
      ),
      s.moduleSpecifier,
      s.attributes,
    );
  });

  if (!added) {
    statements.unshift(
      f.createImportDeclaration(
        undefined,
        f.createImportClause(false, undefined, f.createNamedImports([specifier])),
        f.createStringLiteral(STENCIL_CORE_ID),
      ),
    );
  }
  return f.updateSourceFile(sourceFile, statements);
};
