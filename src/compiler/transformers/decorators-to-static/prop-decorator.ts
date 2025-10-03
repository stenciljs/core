import { augmentDiagnosticWithNode, buildError, buildWarn, toDashCase } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { validatePublicName } from '../reserved-public-members';
import {
  convertValueToLiteral,
  createStaticGetter,
  getAttributeTypeInfo,
  isMemberPrivate,
  resolveType,
  retrieveTsDecorators,
  retrieveTsModifiers,
  serializeSymbol,
  tsPropDeclName,
  typeToString,
} from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

/**
 * Parse a collection of class members decorated with `@Prop()`
 *
 * @param diagnostics a collection of compiler diagnostics. During the parsing process, any errors detected must be
 * added to this collection
 * @param decoratedProps a collection of class elements that may or may not my class members decorated with `@Prop`.
 * Only those decorated with `@Prop()` will be parsed.
 * @param typeChecker a reference to the TypeScript type checker
 * @param program a {@link ts.Program} object
 * @param newMembers a collection that parsed `@Prop` annotated class members should be pushed to as a side effect of calling this function
 * @param decoratorName the name of the decorator to look for
 * @param serializers a collection of serializers (from prop > attribute) used on `@Prop` annotated class members
 */
export const propDecoratorsToStatic = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  decoratedProps: ts.ClassElement[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  newMembers: ts.ClassElement[],
  decoratorName: string,
  serializers: d.ComponentCompilerChangeHandler[],
  deserializers: d.ComponentCompilerChangeHandler[],
): void => {
  const properties = decoratedProps
    .filter((prop) => ts.isPropertyDeclaration(prop) || ts.isGetAccessor(prop))
    .map((prop) =>
      parsePropDecorator(
        config,
        diagnostics,
        typeChecker,
        program,
        prop,
        decoratorName,
        newMembers,
        serializers,
        deserializers,
      ),
    )
    .filter((prop): prop is ts.PropertyAssignment => prop != null);

  if (properties.length > 0) {
    newMembers.push(createStaticGetter('properties', ts.factory.createObjectLiteralExpression(properties, true)));
  }
};

/**
 * Parse a single `@Prop` decorator annotated class member
 * @param diagnostics a collection of compiler diagnostics. During the parsing process, any errors detected must be
 * added to this collection
 * @param typeChecker a reference to the TypeScript type checker
 * @param program a {@link ts.Program} object
 * @param prop the TypeScript `PropertyDeclaration` to parse
 * @param decoratorName the name of the decorator to look for
 * @param newMembers a collection of parsed `@Prop` annotated class members. Used for `get()` decorated props to find a corresponding `set()`
 * @param serializers a collection of serializers (from prop > attribute) used on `@Prop` annotated class members
 * @param deserializers a collection of deserializers (from attribute > prop) used on `@Prop` annotated class members
 * @returns a property assignment expression to be added to the Stencil component's class
 */
const parsePropDecorator = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  prop: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
  decoratorName: string,
  newMembers: ts.ClassElement[],
  serializers: d.ComponentCompilerChangeHandler[],
  deserializers: d.ComponentCompilerChangeHandler[],
): ts.PropertyAssignment | null => {
  const propDecorator = retrieveTsDecorators(prop)?.find(isDecoratorNamed(decoratorName));
  if (propDecorator == null) {
    return null;
  }

  const decoratorParams = getDecoratorParameters<d.PropOptions>(propDecorator, typeChecker);
  const propOptions: d.PropOptions = decoratorParams[0] || {};

  const { staticName: propName, dynamicName: ogPropName } = tsPropDeclName(prop, typeChecker);

  if (isMemberPrivate(prop)) {
    const err = buildError(diagnostics);
    err.messageText =
      'Properties decorated with the @Prop() decorator cannot be "private" nor "protected". More info: https://stenciljs.com/docs/properties';
    augmentDiagnosticWithNode(err, retrieveTsModifiers(prop)![0]);
  }

  if (/^on(-|[A-Z])/.test(propName)) {
    const warn = buildWarn(diagnostics);
    warn.messageText = `The @Prop() name "${propName}" looks like an event. Please use the "@Event()" decorator to expose events instead, not properties or methods.`;
    augmentDiagnosticWithNode(warn, prop.name);
  } else {
    validatePublicName(config, diagnostics, propName, '@Prop()', 'prop', prop.name);
  }

  const symbol = typeChecker.getSymbolAtLocation(prop.name);
  const type = typeChecker.getTypeAtLocation(prop);
  const typeStr = propTypeFromTSType(type);
  const foundSetter = ts.isGetAccessor(prop) ? findSetter(propName, newMembers) : null;

  const propMeta: d.ComponentCompilerStaticProperty = {
    type: typeStr,
    mutable: !!propOptions.mutable,
    complexType: getComplexType(typeChecker, prop, type, program),
    required: prop.exclamationToken !== undefined && propName !== 'mode',
    optional: prop.questionToken !== undefined,
    docs: serializeSymbol(typeChecker, symbol),
    getter: ts.isGetAccessor(prop),
    setter: !!foundSetter,
  };
  if (ogPropName && ogPropName !== propName) {
    propMeta.ogPropName = ogPropName;
  }

  const foundSerializer = !!serializers.find((s) => s.propName === propName);
  const foundDeserializer = !!deserializers.find((s) => s.propName === propName);

  // a `@Prop` can reflect if the type is *not* `unknown` (i.e. string, number, boolean, any)
  // or `@Prop` has a serializer (a fn that can convert a complex type to a string)
  if (typeStr !== 'unknown' || foundSerializer) {
    const explicitReflect = getReflect(diagnostics, propDecorator, propOptions);
    // an explicit reflect argument always wins over inferred
    propMeta.reflect = explicitReflect === null ? foundSerializer : explicitReflect;
  }

  // a `@Prop` is allowed to have an attribute if:
  // - the type is *not* `unknown` (i.e. string, number, boolean, any)
  // - the prop is reflected (because reflected props must have an attribute)
  // - a deserializer has been provided (it doesn't make sense to have a deserializer without an attribute)
  if (typeStr !== 'unknown' || propMeta.reflect || foundDeserializer) {
    propMeta.attribute = getAttributeName(propName, propOptions);
  }

  // extract default value
  if (ts.isPropertyDeclaration(prop) && prop.initializer) {
    propMeta.defaultValue = prop.initializer.getText();
  } else if (ts.isGetAccessorDeclaration(prop)) {
    // shallow comb to find default value for a getter
    const returnStatement = prop.body?.statements.find((st) => ts.isReturnStatement(st)) as ts.ReturnStatement;
    const returnExpression = returnStatement.expression;

    if (returnExpression && ts.isLiteralExpression(returnExpression)) {
      // the getter has a literal return value
      propMeta.defaultValue = returnExpression.getText();
    } else if (returnExpression && ts.isPropertyAccessExpression(returnExpression)) {
      const nameToFind = returnExpression.name.getText();
      const foundProp = findGetProp(nameToFind, newMembers);

      if (foundProp && foundProp.initializer) {
        propMeta.defaultValue = foundProp.initializer.getText();

        if (propMeta.type === 'unknown') {
          const type = typeChecker.getTypeAtLocation(foundProp);
          propMeta.type = propTypeFromTSType(type);
          propMeta.complexType = getComplexType(typeChecker, foundProp, type, program);
        }
      }
    }
  }

  const staticProp = ts.factory.createPropertyAssignment(
    ts.factory.createStringLiteral(propName),
    convertValueToLiteral(propMeta),
  );

  return staticProp;
};

/**
 * Format the attribute name provided as an argument to `@Prop({attribute: ''}`
 * @param propName the prop's name, used as a fallback value
 * @param propOptions the options passed in to the `@Prop` call expression
 * @returns the formatted attribute name
 */
const getAttributeName = (propName: string, propOptions: d.PropOptions): string | undefined => {
  if (propOptions.attribute === null) {
    return undefined;
  }

  if (typeof propOptions.attribute === 'string' && propOptions.attribute.trim().length > 0) {
    return propOptions.attribute.trim().toLowerCase();
  }

  return toDashCase(propName);
};

/**
 * Determines if the 'reflect' property should be applied to the class member decorated with `@Prop`
 * @param diagnostics a collection of compiler diagnostics. Any errors detected with setting 'reflect' must be added to
 * this collection
 * @param propDecorator the AST containing the Prop decorator
 * @param propOptions the options passed in to the `@Prop` call expression
 * @returns `true` if the prop should be reflected in the DOM, `false` otherwise
 */
const getReflect = (diagnostics: d.Diagnostic[], propDecorator: ts.Decorator, propOptions: d.PropOptions) => {
  if (typeof propOptions.reflect === 'boolean') {
    return propOptions.reflect;
  }
  if (typeof (propOptions as any).reflectToAttr === 'boolean') {
    const err = buildError(diagnostics);
    err.header = `Rename "reflectToAttr" to "reflect"`;
    err.messageText = `@Prop option "reflectToAttr" should be renamed to "reflect".`;
    augmentDiagnosticWithNode(err, propDecorator);
    return (propOptions as any).reflectToAttr as boolean;
  }
  return null;
};

const getComplexType = (
  typeChecker: ts.TypeChecker,
  node: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
  type: ts.Type,
  program: ts.Program,
): d.ComponentCompilerPropertyComplexType => {
  const nodeType = node.type;
  return {
    original: nodeType ? nodeType.getText() : typeToString(typeChecker, type),
    resolved: resolveType(typeChecker, type),
    references: getAttributeTypeInfo(
      // If the node did not explicity have a type set (i.e. `name: string`), then
      // we can generate a type node via the type checker to resolve references for inferred types.
      //
      // This is only a concern with non-primitive types such as a user-defined enum.
      //
      // For instance, a @Prop() defined as:
      // @Prop() mode = ComponentModes.DEFAULT;
      // Should be able to correctly infer the type to be `ComponentModes` and
      // resolve the reference to this type for use in generated component type declarations.
      nodeType ? node : typeChecker.typeToTypeNode(type, undefined, undefined),
      node.getSourceFile(),
      typeChecker,
      program,
    ),
  };
};

/**
 * Derives a Stencil-permitted prop type from the TypeScript compiler's output. This function may narrow the type of a
 * prop, as the types that can be returned from the TypeScript compiler may be more complex than what Stencil can/should
 * handle for props.
 * @param type the prop type to narrow
 * @returns a valid Stencil prop type
 */
export const propTypeFromTSType = (type: ts.Type): 'any' | 'boolean' | 'number' | 'string' | 'unknown' => {
  const isAnyType = checkType(type, isAny);

  if (isAnyType) {
    return 'any';
  }

  const isStr = checkType(type, isString);
  const isNu = checkType(type, isNumber);
  const isBool = checkType(type, isBoolean);

  // if type is more than a primitive type at the same time, we mark it as any
  if (Number(isStr) + Number(isNu) + Number(isBool) > 1) {
    return 'any';
  }

  // at this point we know the prop's type is NOT the mix of primitive types
  if (isStr) {
    return 'string';
  }
  if (isNu) {
    return 'number';
  }
  if (isBool) {
    return 'boolean';
  }
  return 'unknown';
};

/**
 * Determines if a TypeScript compiler given `Type` is of a particular type according to the provided `check` parameter.
 * Union types (e.g. `boolean | number | string`) will be evaluated one type at a time.
 * @param type the TypeScript `Type` entity to evaluate
 * @param check a function that takes a TypeScript `Type` as its only argument and returns `true` if the `Type` conforms
 * to a particular type
 * @returns the result of the `check` argument. The result of `check` is `true` for one or more types in a union type,
 * return `true`.
 */
const checkType = (type: ts.Type, check: (type: ts.Type) => boolean): boolean => {
  if (type.flags & ts.TypeFlags.Union) {
    // if the type is a union, check each type in the union
    const union = type as ts.UnionType;
    if (union.types.some((type) => checkType(type, check))) {
      return true;
    }
  }
  return check(type);
};

/**
 * Determine if a TypeScript compiler `Type` is a boolean
 * @param t the `Type` to evaluate
 * @returns `true` if the `Type` has any boolean-similar flags, `false` otherwise
 */
const isBoolean = (t: ts.Type): boolean => {
  if (t) {
    return !!(t.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLike));
  }
  return false;
};

/**
 * Determine if a TypeScript compiler `Type` is a number
 * @param t the `Type` to evaluate
 * @returns `true` if the `Type` has any number-similar flags, `false` otherwise
 */
const isNumber = (t: ts.Type): boolean => {
  if (t) {
    return !!(t.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLike | ts.TypeFlags.NumberLiteral));
  }
  return false;
};

/**
 * Determine if a TypeScript compiler `Type` is a string
 * @param t the `Type` to evaluate
 * @returns `true` if the `Type` has any string-similar flags, `false` otherwise
 */
const isString = (t: ts.Type): boolean => {
  if (t) {
    return !!(t.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLike | ts.TypeFlags.StringLiteral));
  }
  return false;
};

/**
 * Determine if a TypeScript compiler `Type` is of type any
 * @param t the `Type` to evaluate
 * @returns `true` if the `Type` has the `Any` flag set on it, `false` otherwise
 */
const isAny = (t: ts.Type): boolean => {
  if (t) {
    return !!(t.flags & ts.TypeFlags.Any);
  }
  return false;
};

/**
 * Attempts to find a `set` member of the class when there is a corresponding getter
 * @param propName - the property name of the setter to find
 * @param members - all the component class members
 * @returns the found typescript AST setter node
 */
const findSetter = (propName: string, members: ts.ClassElement[]): ts.SetAccessorDeclaration | undefined => {
  return members.find((m) => ts.isSetAccessor(m) && m.name.getText() === propName) as
    | ts.SetAccessorDeclaration
    | undefined;
};

/**
 * When attempting to find the default value of a decorated `get` prop, if a member like `this.something`
 * is returned, this method is used to comb the class members to attempt to get it's default value
 * @param propName - the property name of the member to find
 * @param members - all the component class members
 * @returns the found typescript AST class member
 */
const findGetProp = (propName: string, members: ts.ClassElement[]): ts.PropertyDeclaration | undefined => {
  return members.find((m) => ts.isPropertyDeclaration(m) && m.name.getText() === propName) as ts.PropertyDeclaration;
};
