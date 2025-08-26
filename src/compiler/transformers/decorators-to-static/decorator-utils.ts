import ts from 'typescript';

import { objectLiteralToObjectMap, objectLiteralToObjectMapWithConstants } from '../transform-utils';
import { getNodeText, tryResolveConstantValue, tryResolveImportedConstant } from './constant-resolution-utils';

/**
 * Extract the decorator name from a decorator expression
 * @param decorator - The decorator to extract the name from
 * @returns The name of the decorator or null if it cannot be determined
 */
export const getDecoratorName = (decorator: ts.Decorator): string | null => {
  if (ts.isCallExpression(decorator.expression)) {
    if (ts.isIdentifier(decorator.expression.expression)) {
      return decorator.expression.expression.text;
    }
  } else if (ts.isIdentifier(decorator.expression)) {
    return decorator.expression.text;
  }
  return null;
};

/**
 * Extract the parameters from a decorator expression
 * @param decorator - The decorator to extract the parameters from
 * @param typeChecker - The TypeScript type checker
 * @returns The parameters of the decorator
 */
export const getDecoratorParameters: GetDecoratorParameters = (
  decorator: ts.Decorator,
  typeChecker: ts.TypeChecker,
): any => {
  if (!ts.isCallExpression(decorator.expression)) {
    return [];
  }

  // Check if this is an @Event or @Listen decorator - only apply constant resolution to these
  const decoratorName = getDecoratorName(decorator);
  const shouldResolveConstants = decoratorName === 'Event' || decoratorName === 'Listen';

  return decorator.expression.arguments.map((arg) => getDecoratorParameter(arg, typeChecker, shouldResolveConstants));
};

/**
 * Extract the parameter from a decorator expression
 * @param arg - The argument to extract the parameter from
 * @param typeChecker - The TypeScript type checker
 * @param shouldResolveConstants - Whether to resolve constants
 * @returns The parameter of the decorator
 */
export const getDecoratorParameter = (
  arg: ts.Expression,
  typeChecker: ts.TypeChecker,
  shouldResolveConstants: boolean = true,
): any => {
  if (ts.isObjectLiteralExpression(arg)) {
    // Use enhanced constant resolution for Event/Listen decorators, fall back to basic version for others
    if (shouldResolveConstants) {
      return objectLiteralToObjectMapWithConstants(arg, typeChecker);
    } else {
      return objectLiteralToObjectMap(arg);
    }
  } else if (ts.isStringLiteral(arg)) {
    return arg.text;
  } else if (ts.isPropertyAccessExpression(arg) || ts.isIdentifier(arg)) {
    if (shouldResolveConstants) {
      const type = typeChecker.getTypeAtLocation(arg);
      if (type !== undefined) {
        // First check if it's a literal type (most precise)
        if (type.isLiteral()) {
          /**
           * Using enums or variables require us to resolve the value for
           * the computed property/identifier via the TS type checker. As long
           * as the type resolves to a literal, we can grab its value to be used
           * as the decorator argument.
           */
          return type.value;
        }

        // Enhanced: Also accept string/number/boolean constants even without 'as const'
        // This makes the decorator resolution more robust for common use cases
        if (type.flags & ts.TypeFlags.StringLiteral) {
          return (type as ts.StringLiteralType).value;
        }
        if (type.flags & ts.TypeFlags.NumberLiteral) {
          return (type as ts.NumberLiteralType).value;
        }
        if (type.flags & ts.TypeFlags.BooleanLiteral) {
          return (type as any).intrinsicName === 'true';
        }

        // For union types, check if all members are literals of the same type
        if (type.flags & ts.TypeFlags.Union) {
          const unionType = type as ts.UnionType;
          const literalTypes = unionType.types.filter(
            (t) => t.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral),
          );

          // If it's a single literal in a union (e.g., from const assertion), use it
          if (literalTypes.length === 1) {
            const literalType = literalTypes[0];
            if (literalType.flags & ts.TypeFlags.StringLiteral) {
              return (literalType as ts.StringLiteralType).value;
            }
            if (literalType.flags & ts.TypeFlags.NumberLiteral) {
              return (literalType as ts.NumberLiteralType).value;
            }
            if (literalType.flags & ts.TypeFlags.BooleanLiteral) {
              return (literalType as any).intrinsicName === 'true';
            }
          }
        }

        // Enhanced: Try to resolve the symbol and evaluate constant properties
        // This handles cases like `EVENT_NAMES.CLICK` where EVENT_NAMES is defined without 'as const'
        const symbol = typeChecker.getSymbolAtLocation(arg);
        if (symbol && symbol.valueDeclaration) {
          const constantValue = tryResolveConstantValue(arg, typeChecker);
          if (constantValue !== undefined) {
            return constantValue;
          }
        }

        // Try to resolve cross-module imports
        const importValue = tryResolveImportedConstant(arg, typeChecker);
        if (importValue !== undefined) {
          return importValue;
        }
      }
    } else {
      // For non-Event/Listen decorators, try the basic literal type check for backward compatibility
      const type = typeChecker.getTypeAtLocation(arg);
      if (type !== undefined) {
        // First check if it's a literal type (most precise)
        if (type.isLiteral()) {
          return type.value;
        }

        // Fallback: Also check type flags for literal types (for backward compatibility)
        if (type.flags & ts.TypeFlags.StringLiteral) {
          return (type as ts.StringLiteralType).value;
        }
        if (type.flags & ts.TypeFlags.NumberLiteral) {
          return (type as ts.NumberLiteralType).value;
        }
        if (type.flags & ts.TypeFlags.BooleanLiteral) {
          return (type as any).intrinsicName === 'true';
        }

        // For union types, check if all members are literals of the same type
        if (type.flags & ts.TypeFlags.Union) {
          const unionType = type as ts.UnionType;
          const literalTypes = unionType.types.filter(
            (t) => t.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral),
          );

          // If it's a single literal in a union (e.g., from const assertion), use it
          if (literalTypes.length === 1) {
            const literalType = literalTypes[0];
            if (literalType.flags & ts.TypeFlags.StringLiteral) {
              return (literalType as ts.StringLiteralType).value;
            }
            if (literalType.flags & ts.TypeFlags.NumberLiteral) {
              return (literalType as ts.NumberLiteralType).value;
            }
            if (literalType.flags & ts.TypeFlags.BooleanLiteral) {
              return (literalType as any).intrinsicName === 'true';
            }
          }
        }
      }
    }
  }

  // Graceful fallback: if we can't resolve it and it's a constant resolution attempt,
  // just return the original expression text and let the runtime handle it
  if (shouldResolveConstants) {
    const nodeText = getNodeText(arg);
    console.warn(`Could not resolve constant decorator argument: ${nodeText}. Using original expression.`);
    return nodeText;
  }

  const nodeText = getNodeText(arg);
  throw new Error(`invalid decorator argument: ${nodeText} - must be a string literal, constant, or enum value`);
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
  <T>(decorator: ts.Decorator, typeChecker: ts.TypeChecker): [T];
  <T, T1>(decorator: ts.Decorator, typeChecker: ts.TypeChecker): [T, T1];
  <T, T1, T2>(decorator: ts.Decorator, typeChecker: ts.TypeChecker): [T, T1, T2];
}
