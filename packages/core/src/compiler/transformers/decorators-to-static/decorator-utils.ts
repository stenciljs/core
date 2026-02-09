import ts from 'typescript';

import type * as d from '@stencil/core';
import { augmentDiagnosticWithNode, buildError } from '../../../utils';
import { objectLiteralToObjectMap } from '../transform-utils';

export const getDecoratorParameters: GetDecoratorParameters = (
  decorator: ts.Decorator,
  typeChecker: ts.TypeChecker,
  diagnostics?: d.Diagnostic[],
): any => {
  if (!ts.isCallExpression(decorator.expression)) {
    return [];
  }
  return decorator.expression.arguments.map((arg) =>
    getDecoratorParameter(arg, typeChecker, diagnostics, decorator.expression),
  );
};

const getDecoratorParameter = (
  arg: ts.Expression,
  typeChecker: ts.TypeChecker,
  diagnostics?: d.Diagnostic[],
  errorNode?: ts.Node,
): any => {
  // Check if this is a resolveVar() call
  if (ts.isCallExpression(arg)) {
    const expression = arg.expression;
    if (
      (ts.isIdentifier(expression) && expression.text === 'resolveVar') ||
      (ts.isPropertyAccessExpression(expression) &&
        ts.isIdentifier(expression.name) &&
        expression.name.text === 'resolveVar')
    ) {
      // Extract the argument passed to resolveVar
      if (arg.arguments.length !== 1) {
        const err = buildError(diagnostics);
        err.messageText = 'resolveVar() expects exactly one argument.';
        if (errorNode) {
          augmentDiagnosticWithNode(err, errorNode);
        }
        throw new Error(err.messageText);
      }

      const resolveArg = arg.arguments[0];
      return resolveVariableValue(resolveArg, typeChecker, diagnostics, resolveArg);
    }
  }

  if (ts.isObjectLiteralExpression(arg)) {
    return objectLiteralToObjectMap(arg, typeChecker, diagnostics, errorNode);
  } else if (ts.isStringLiteral(arg)) {
    return arg.text;
  } else if (ts.isPropertyAccessExpression(arg) || ts.isIdentifier(arg)) {
    const type = typeChecker.getTypeAtLocation(arg);
    if (type !== undefined && type.isLiteral()) {
      /**
       * Using enums or variables require us to resolve the value for
       * the computed property/identifier via the TS type checker. As long
       * as the type resolves to a literal, we can grab its value to be used
       * as the `@Watch()` decorator argument.
       */
      return type.value;
    }
  }

  throw new Error(`invalid decorator argument: ${arg.getText()}`);
};

/**
 * Resolves a variable or object property to its string literal value at compile time.
 * Supports const variables and object properties with string literal values.
 */
const resolveVariableValue = (
  node: ts.Expression,
  typeChecker: ts.TypeChecker,
  diagnostics?: d.Diagnostic[],
  errorNode?: ts.Node,
): string => {
  // Handle identifiers (const variables)
  if (ts.isIdentifier(node)) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol || !symbol.valueDeclaration) {
      const err = buildError(diagnostics);
      err.messageText = `resolveVar() cannot resolve the value of "${node.text}" at compile time. Only const variables and object properties with string literal values are supported.`;
      if (errorNode) {
        augmentDiagnosticWithNode(err, errorNode);
      }
      throw new Error(err.messageText);
    }

    const declaration = symbol.valueDeclaration;

    // Check if it's a const variable declaration
    if (ts.isVariableDeclaration(declaration)) {
      // Try to get the type first (works for 'as const' assertions)
      const type = typeChecker.getTypeAtLocation(node);
      if (type && type.isLiteral() && typeof type.value === 'string') {
        return type.value;
      }

      // Fall back to extracting from initializer
      if (declaration.initializer) {
        const initializerValue = extractStringFromExpression(declaration.initializer, typeChecker);
        if (initializerValue !== null) {
          return initializerValue;
        }
      }
    }

    const err = buildError(diagnostics);
    err.messageText = `resolveVar() cannot resolve the value of "${node.text}" at compile time. Only const variables and object properties with string literal values are supported.`;
    if (errorNode) {
      augmentDiagnosticWithNode(err, errorNode);
    }
    throw new Error(err.messageText);
  }

  // Handle property access expressions (object properties)
  if (ts.isPropertyAccessExpression(node)) {
    const objectType = typeChecker.getTypeAtLocation(node.expression);
    if (!objectType) {
      const err = buildError(diagnostics);
      err.messageText = `resolveVar() cannot resolve the object type for "${node.getText()}" at compile time.`;
      if (errorNode) {
        augmentDiagnosticWithNode(err, errorNode);
      }
      throw new Error(err.messageText);
    }

    const propertyName = node.name.text;
    const property = typeChecker.getPropertyOfType(objectType, propertyName);
    if (!property) {
      const err = buildError(diagnostics);
      err.messageText = `resolveVar() cannot find property "${propertyName}" on object "${node.expression.getText()}" at compile time.`;
      if (errorNode) {
        augmentDiagnosticWithNode(err, errorNode);
      }
      throw new Error(err.messageText);
    }

    // Get the type of the property
    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
    if (propertyType && propertyType.isLiteral() && typeof propertyType.value === 'string') {
      return propertyType.value;
    }

    // Try to get the value from the symbol's declaration
    if (property.valueDeclaration) {
      if (ts.isPropertyDeclaration(property.valueDeclaration)) {
        const initializer = property.valueDeclaration.initializer;
        if (initializer) {
          const value = extractStringFromExpression(initializer, typeChecker);
          if (value !== null) {
            return value;
          }
        }
      } else if (ts.isPropertySignature(property.valueDeclaration)) {
        // PropertySignature doesn't have initializer
        // The type-based resolution above should handle this case
      } else if (ts.isVariableDeclaration(property.valueDeclaration)) {
        const initializer = property.valueDeclaration.initializer;
        if (initializer) {
          const value = extractStringFromExpression(initializer, typeChecker);
          if (value !== null) {
            return value;
          }
        }
      }
    }

    const err = buildError(diagnostics);
    err.messageText = `resolveVar() cannot resolve the value of "${node.getText()}" at compile time. Only const variables and object properties with string literal values are supported.`;
    if (errorNode) {
      augmentDiagnosticWithNode(err, errorNode);
    }
    throw new Error(err.messageText);
  }

  const err = buildError(diagnostics);
  err.messageText = `resolveVar() can only be used with const variables or object properties. "${node.getText()}" is not supported.`;
  if (errorNode) {
    augmentDiagnosticWithNode(err, errorNode);
  }
  throw new Error(err.messageText);
};

/**
 * Extracts a string value from a TypeScript expression.
 * Returns null if the expression doesn't represent a string literal.
 */
const extractStringFromExpression = (expr: ts.Expression, typeChecker: ts.TypeChecker): string | null => {
  // String literal
  if (ts.isStringLiteral(expr)) {
    return expr.text;
  }

  // Template literal (no substitutions)
  if (ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }

  // Check if the type is a string literal type
  const type = typeChecker.getTypeAtLocation(expr);
  if (type && type.isLiteral() && typeof type.value === 'string') {
    return type.value;
  }

  return null;
};

/**
 * Returns a function that checks if a decorator:
 * - is a call expression. these are decorators that are immediately followed by open/close parenthesis with optional
 *   arg(s), e.g. `@Prop()`
 * - the name of the decorator matches the provided `propName`
 *
 * @param propName the name of the decorator to match against
 * @returns true if the conditions above are both true, false otherwise
 */
export const isDecoratorNamed = (propName: string) => {
  return (dec: ts.Decorator): boolean => {
    return ts.isCallExpression(dec.expression) && dec.expression.expression.getText() === propName;
  };
};

export interface GetDecoratorParameters {
  <T>(decorator: ts.Decorator, typeChecker: ts.TypeChecker, diagnostics?: d.Diagnostic[]): [T];
  <T, T1>(decorator: ts.Decorator, typeChecker: ts.TypeChecker, diagnostics?: d.Diagnostic[]): [T, T1];
  <T, T1, T2>(decorator: ts.Decorator, typeChecker: ts.TypeChecker, diagnostics?: d.Diagnostic[]): [T, T1, T2];
}
