import ts from 'typescript';

/**
 * Safely get text from a TypeScript node, handling synthetic nodes
 * @param node - The node to get the text from
 * @returns The text of the node
 */
export const getNodeText = (node: ts.Node): string => {
  try {
    // For synthetic nodes or nodes without source positions, try to get a meaningful representation
    if (!node.getSourceFile() || node.pos === -1) {
      if (ts.isIdentifier(node)) {
        return node.text;
      } else if (ts.isStringLiteral(node)) {
        return `"${node.text}"`;
      } else if (ts.isNumericLiteral(node)) {
        return node.text;
      } else if (ts.isPropertyAccessExpression(node)) {
        return `${getNodeText(node.expression)}.${getNodeText(node.name)}`;
      } else {
        return ts.SyntaxKind[node.kind] || 'unknown';
      }
    }
    return node.getText();
  } catch (error) {
    // Fallback for any other errors
    if (ts.isIdentifier(node)) {
      return node.text;
    }
    return ts.SyntaxKind[node.kind] || 'unknown';
  }
};

/**
 * Helper function to extract property name from various property name types
 * @param propName - The property name to extract
 * @returns The property name
 */
export const getPropertyName = (propName: ts.PropertyName): string | null => {
  if (ts.isIdentifier(propName)) {
    return propName.text;
  } else if (ts.isStringLiteral(propName)) {
    return propName.text;
  } else if (ts.isNumericLiteral(propName)) {
    return propName.text;
  }
  return null;
};

/**
 * Helper function to get computed property value at compile time
 * @param expr - The expression to get the computed property value from
 * @param typeChecker - The TypeScript type checker
 * @param sourceFile - The source file to get the computed property value from
 * @returns The computed property value
 */
export const getComputedPropertyValue = (
  expr: ts.Expression,
  typeChecker: ts.TypeChecker,
  sourceFile?: ts.SourceFile,
): string | null => {
  const resolved = tryResolveConstantValue(expr, typeChecker, sourceFile);
  return typeof resolved === 'string' ? resolved : null;
};

/**
 * Try to resolve an imported constant from another module
 * This handles cases like imported EVENT_NAMES or SHARED_EVENT
 * @param expr - The expression to try to resolve the imported constant from
 * @param typeChecker - The TypeScript type checker
 * @returns The imported constant
 */
export const tryResolveImportedConstant = (expr: ts.Expression, typeChecker: ts.TypeChecker): any => {
  const symbol = typeChecker.getSymbolAtLocation(expr);
  if (!symbol) return undefined;

  // Check if this symbol comes from an import
  if (symbol.flags & ts.SymbolFlags.Alias) {
    const aliasedSymbol = typeChecker.getAliasedSymbol(symbol);
    if (aliasedSymbol?.valueDeclaration) {
      return tryResolveConstantValue(expr, typeChecker, aliasedSymbol.valueDeclaration.getSourceFile());
    }
  }

  // For property access expressions on imported symbols
  if (ts.isPropertyAccessExpression(expr)) {
    const leftSymbol = typeChecker.getSymbolAtLocation(expr.expression);
    if (leftSymbol && leftSymbol.flags & ts.SymbolFlags.Alias) {
      const aliasedSymbol = typeChecker.getAliasedSymbol(leftSymbol);
      if (aliasedSymbol?.valueDeclaration) {
        // Try to resolve the imported object and then access the property
        const importedValue = tryResolveConstantValue(
          expr.expression,
          typeChecker,
          aliasedSymbol.valueDeclaration.getSourceFile(),
        );
        if (importedValue && typeof importedValue === 'object') {
          const propName = ts.isIdentifier(expr.name) ? expr.name.text : null;
          if (propName && propName in importedValue) {
            return importedValue[propName];
          }
        }
      }
    }
  }

  return undefined;
};

/**
 * Try to resolve a constant value by evaluating the expression at compile time
 * This handles cases like `EVENT_NAMES.CLICK` where EVENT_NAMES is a const object
 * @param expr - The expression to try to resolve the constant value from
 * @param typeChecker - The TypeScript type checker
 * @param sourceFile - The source file to try to resolve the constant value from
 * @returns The constant value
 */
export const tryResolveConstantValue = (
  expr: ts.Expression,
  typeChecker: ts.TypeChecker,
  sourceFile?: ts.SourceFile,
): any => {
  if (ts.isPropertyAccessExpression(expr)) {
    // For property access like `EVENT_NAMES.CLICK` or `EVENT_NAMES.USER.LOGIN`
    // First resolve the object (left side of the dot)
    const objValue = tryResolveConstantValue(expr.expression, typeChecker, sourceFile);

    if (objValue !== undefined && typeof objValue === 'object' && objValue !== null) {
      // If we have an object, try to access the property
      const propName = ts.isIdentifier(expr.name) ? expr.name.text : null;
      if (propName && propName in objValue) {
        return objValue[propName];
      }
    }

    // Fallback: try to resolve using symbol table for simple property access
    const objSymbol = typeChecker.getSymbolAtLocation(expr.expression);
    if (objSymbol?.valueDeclaration && ts.isVariableDeclaration(objSymbol.valueDeclaration)) {
      const initializer = objSymbol.valueDeclaration.initializer;
      if (initializer && ts.isObjectLiteralExpression(initializer)) {
        for (const prop of initializer.properties) {
          if (ts.isPropertyAssignment(prop)) {
            const propName = getPropertyName(prop.name);
            let accessedProp: string | null = null;
            const propertyName = expr.name;
            if (ts.isIdentifier(propertyName)) {
              accessedProp = propertyName.text;
            } else {
              // Use getPropertyName helper which handles all property name types safely
              accessedProp = getPropertyName(propertyName);
            }

            if (propName === accessedProp) {
              // Recursively resolve the property value
              return tryResolveConstantValue(prop.initializer, typeChecker, sourceFile);
            }
          } else if (ts.isShorthandPropertyAssignment(prop)) {
            // Handle shorthand properties like { click } where click is a variable
            const propName = ts.isIdentifier(prop.name) ? prop.name.text : null;
            const accessedProp = ts.isIdentifier(expr.name) ? expr.name.text : null;

            if (propName === accessedProp) {
              // For shorthand properties, the value is the same as the property name
              // So we need to resolve the variable that the property refers to
              return tryResolveConstantValue(prop.name, typeChecker, sourceFile);
            }
          }
        }
      }
    }
  } else if (ts.isIdentifier(expr)) {
    // For simple identifiers like `CLICK` or `EVENT_NAME`
    const symbol = typeChecker.getSymbolAtLocation(expr);
    if (symbol?.valueDeclaration && ts.isVariableDeclaration(symbol.valueDeclaration)) {
      const initializer = symbol.valueDeclaration.initializer;
      if (initializer) {
        return tryResolveConstantValue(initializer, typeChecker, sourceFile);
      }
    }
  } else if (ts.isObjectLiteralExpression(expr)) {
    // For object literals, try to resolve all properties
    const obj: any = {};
    for (const prop of expr.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const propName = ts.isIdentifier(prop.name)
          ? prop.name.text
          : ts.isStringLiteral(prop.name)
            ? prop.name.text
            : null;
        if (propName) {
          const propValue = tryResolveConstantValue(prop.initializer, typeChecker, sourceFile);
          if (propValue !== undefined) {
            obj[propName] = propValue;
          }
        }
      }
    }
    return obj;
  } else if (ts.isStringLiteral(expr)) {
    return expr.text;
  } else if (ts.isNumericLiteral(expr)) {
    return Number(expr.text);
  } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  } else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  } else if (expr.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  } else if (expr.kind === ts.SyntaxKind.UndefinedKeyword) {
    return undefined;
  } else if (ts.isTemplateExpression(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    // For template literals, we could try to resolve them if they only contain constants
    // For now, just return undefined as this requires more complex evaluation
    return undefined;
  }

  return undefined;
};
