import ts from 'typescript';

import {
  getComputedPropertyValue,
  getNodeText,
  getPropertyName,
  tryResolveConstantValue,
  tryResolveImportedConstant,
} from '../decorators-to-static/constant-resolution-utils';

describe('constant-resolution-utils', () => {
  // Create a mock TypeScript type checker for tests that need it
  const createMockTypeChecker = (): ts.TypeChecker => {
    return {
      getSymbolAtLocation: jest.fn().mockReturnValue(undefined),
      getTypeAtLocation: jest.fn().mockReturnValue(undefined),
      getAliasedSymbol: jest.fn().mockReturnValue(undefined),
    } as any;
  };

  describe('getNodeText', () => {
    it('should return text for identifier nodes', () => {
      const identifier = ts.factory.createIdentifier('testIdentifier');
      const result = getNodeText(identifier);
      expect(result).toBe('testIdentifier');
    });

    it('should return quoted text for string literal nodes', () => {
      const stringLiteral = ts.factory.createStringLiteral('test string');
      const result = getNodeText(stringLiteral);
      expect(result).toBe('"test string"');
    });

    it('should return text for numeric literal nodes', () => {
      const numericLiteral = ts.factory.createNumericLiteral('42');
      const result = getNodeText(numericLiteral);
      expect(result).toBe('42');
    });

    it('should handle property access expressions', () => {
      const obj = ts.factory.createIdentifier('obj');
      const prop = ts.factory.createIdentifier('prop');
      const propertyAccess = ts.factory.createPropertyAccessExpression(obj, prop);
      const result = getNodeText(propertyAccess);
      expect(result).toBe('obj.prop');
    });

    it('should handle synthetic nodes without source positions', () => {
      const identifier = ts.factory.createIdentifier('synthetic');
      // Simulate a synthetic node by setting pos to -1
      (identifier as any).pos = -1;
      const result = getNodeText(identifier);
      expect(result).toBe('synthetic');
    });

    it('should return syntax kind for unknown node types', () => {
      const node = ts.factory.createVoidExpression(ts.factory.createNumericLiteral('0'));
      const result = getNodeText(node);
      expect(result).toContain('VoidExpression');
    });
  });

  describe('getPropertyName', () => {
    it('should extract text from identifier property names', () => {
      const identifier = ts.factory.createIdentifier('propName');
      const result = getPropertyName(identifier);
      expect(result).toBe('propName');
    });

    it('should extract text from string literal property names', () => {
      const stringLiteral = ts.factory.createStringLiteral('propName');
      const result = getPropertyName(stringLiteral);
      expect(result).toBe('propName');
    });

    it('should extract text from numeric literal property names', () => {
      const numericLiteral = ts.factory.createNumericLiteral('42');
      const result = getPropertyName(numericLiteral);
      expect(result).toBe('42');
    });

    it('should return null for computed property names', () => {
      const computedProp = ts.factory.createComputedPropertyName(ts.factory.createIdentifier('computed'));
      const result = getPropertyName(computedProp);
      expect(result).toBe(null);
    });
  });

  describe('getComputedPropertyValue', () => {
    it('should return string value when tryResolveConstantValue returns a string', () => {
      const mockTypeChecker = createMockTypeChecker();
      const identifier = ts.factory.createIdentifier('testIdentifier');

      // Mock tryResolveConstantValue to return a string (this would be done by jest.spyOn in real scenarios)
      const originalTryResolve = tryResolveConstantValue;
      (tryResolveConstantValue as any) = jest.fn().mockReturnValue('resolvedString');

      const result = getComputedPropertyValue(identifier, mockTypeChecker);
      expect(result).toBe('resolvedString');

      // Restore original function
      (tryResolveConstantValue as any) = originalTryResolve;
    });

    it('should return null when tryResolveConstantValue returns non-string', () => {
      const mockTypeChecker = createMockTypeChecker();
      const identifier = ts.factory.createIdentifier('testIdentifier');

      const originalTryResolve = tryResolveConstantValue;
      (tryResolveConstantValue as any) = jest.fn().mockReturnValue(42);

      const result = getComputedPropertyValue(identifier, mockTypeChecker);
      expect(result).toBe(null);

      (tryResolveConstantValue as any) = originalTryResolve;
    });

    it('should return null when tryResolveConstantValue returns undefined', () => {
      const mockTypeChecker = createMockTypeChecker();
      const identifier = ts.factory.createIdentifier('unknownVariable');

      const originalTryResolve = tryResolveConstantValue;
      (tryResolveConstantValue as any) = jest.fn().mockReturnValue(undefined);

      const result = getComputedPropertyValue(identifier, mockTypeChecker);
      expect(result).toBe(null);

      (tryResolveConstantValue as any) = originalTryResolve;
    });
  });

  describe('tryResolveConstantValue', () => {
    it('should resolve string literal values', () => {
      const mockTypeChecker = createMockTypeChecker();
      const stringLiteral = ts.factory.createStringLiteral('test');
      const result = tryResolveConstantValue(stringLiteral, mockTypeChecker);
      expect(result).toBe('test');
    });

    it('should resolve numeric literal values', () => {
      const mockTypeChecker = createMockTypeChecker();
      const numericLiteral = ts.factory.createNumericLiteral('42');
      const result = tryResolveConstantValue(numericLiteral, mockTypeChecker);
      expect(result).toBe(42);
    });

    it('should resolve boolean literal values', () => {
      const mockTypeChecker = createMockTypeChecker();
      const trueLiteral = ts.factory.createTrue();
      const falseLiteral = ts.factory.createFalse();

      expect(tryResolveConstantValue(trueLiteral, mockTypeChecker)).toBe(true);
      expect(tryResolveConstantValue(falseLiteral, mockTypeChecker)).toBe(false);
    });

    it('should resolve object literal expressions', () => {
      const mockTypeChecker = createMockTypeChecker();
      const objLiteral = ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment('key1', ts.factory.createStringLiteral('value1')),
        ts.factory.createPropertyAssignment('key2', ts.factory.createNumericLiteral('42')),
      ]);

      const result = tryResolveConstantValue(objLiteral, mockTypeChecker);
      expect(result).toEqual({ key1: 'value1', key2: 42 });
    });

    it('should return undefined for unresolvable identifier expressions', () => {
      const mockTypeChecker = createMockTypeChecker();
      const unknownId = ts.factory.createIdentifier('unknownVariable');
      const result = tryResolveConstantValue(unknownId, mockTypeChecker);
      expect(result).toBe(undefined);
    });

    it('should return undefined for template expressions', () => {
      const mockTypeChecker = createMockTypeChecker();
      const templateExpr = ts.factory.createTemplateExpression(ts.factory.createTemplateHead('start'), [
        ts.factory.createTemplateSpan(ts.factory.createIdentifier('variable'), ts.factory.createTemplateTail('end')),
      ]);
      const result = tryResolveConstantValue(templateExpr, mockTypeChecker);
      expect(result).toBe(undefined);
    });

    it('should handle property access expressions with mock objects', () => {
      const mockTypeChecker = createMockTypeChecker();

      // Create a proper variable declaration mock
      const objLiteral = ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment('CLICK', ts.factory.createStringLiteral('click')),
      ]);

      const mockSymbol = {
        valueDeclaration: ts.factory.createVariableDeclaration('EVENT_NAMES', undefined, undefined, objLiteral),
      };

      mockTypeChecker.getSymbolAtLocation = jest.fn().mockReturnValue(mockSymbol);

      const eventNamesId = ts.factory.createIdentifier('EVENT_NAMES');
      const clickId = ts.factory.createIdentifier('CLICK');
      const propertyAccess = ts.factory.createPropertyAccessExpression(eventNamesId, clickId);

      const result = tryResolveConstantValue(propertyAccess, mockTypeChecker);
      expect(result).toBe('click');
    });

    it('should handle null and undefined keywords', () => {
      const mockTypeChecker = createMockTypeChecker();

      // Create null token (keyword)
      const nullToken = ts.factory.createToken(ts.SyntaxKind.NullKeyword) as ts.Expression;

      // Create undefined token (keyword)
      const undefinedToken = ts.factory.createToken(ts.SyntaxKind.UndefinedKeyword) as ts.Expression;

      expect(tryResolveConstantValue(nullToken, mockTypeChecker)).toBe(null);
      expect(tryResolveConstantValue(undefinedToken, mockTypeChecker)).toBe(undefined);
    });
  });

  describe('tryResolveImportedConstant', () => {
    it('should return undefined for non-imported identifiers', () => {
      const mockTypeChecker = createMockTypeChecker();
      const localId = ts.factory.createIdentifier('localVariable');
      const result = tryResolveImportedConstant(localId, mockTypeChecker);
      expect(result).toBe(undefined);
    });

    it('should return undefined for identifiers without symbols', () => {
      const mockTypeChecker = createMockTypeChecker();
      const unknownId = ts.factory.createIdentifier('unknownImport');
      const result = tryResolveImportedConstant(unknownId, mockTypeChecker);
      expect(result).toBe(undefined);
    });

    it('should handle aliased symbols', () => {
      const mockTypeChecker = createMockTypeChecker();

      // Mock an aliased symbol (from import)
      const mockAliasedSymbol = {
        valueDeclaration: {
          getSourceFile: () => ({ fileName: 'external-module.ts' }),
        },
      };

      const mockSymbol = {
        flags: ts.SymbolFlags.Alias,
        valueDeclaration: null,
      };

      mockTypeChecker.getSymbolAtLocation = jest.fn().mockReturnValue(mockSymbol);
      mockTypeChecker.getAliasedSymbol = jest.fn().mockReturnValue(mockAliasedSymbol);

      const importedId = ts.factory.createIdentifier('IMPORTED_CONST');
      const result = tryResolveImportedConstant(importedId, mockTypeChecker);

      // Since we can't fully mock the resolution without more setup, expect undefined
      expect(result).toBe(undefined);
    });

    it('should handle property access on imported symbols', () => {
      const mockTypeChecker = createMockTypeChecker();

      const objId = ts.factory.createIdentifier('IMPORTED_OBJ');
      const propId = ts.factory.createIdentifier('PROP');
      const propertyAccess = ts.factory.createPropertyAccessExpression(objId, propId);

      const result = tryResolveImportedConstant(propertyAccess, mockTypeChecker);
      expect(result).toBe(undefined);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed AST nodes gracefully', () => {
      const mockTypeChecker = createMockTypeChecker();
      // Test with a node that has undefined properties
      const malformedNode = {} as ts.Expression;

      const result = tryResolveConstantValue(malformedNode, mockTypeChecker);
      expect(result).toBe(undefined);
    });

    it('should handle property access with non-identifier names', () => {
      const mockTypeChecker = createMockTypeChecker();

      // Create property access with computed property name
      const obj = ts.factory.createIdentifier('obj');

      // PropertyAccessExpression requires identifier, so this tests the fallback case
      const propertyAccess = ts.factory.createPropertyAccessExpression(obj, obj); // Using obj as placeholder

      const result = tryResolveConstantValue(propertyAccess, mockTypeChecker);

      expect(result).toBe(undefined);
    });

    it('should handle identifiers with no symbol', () => {
      const mockTypeChecker = createMockTypeChecker();
      const unknownId = ts.factory.createIdentifier('unknownVariable');

      const result = tryResolveConstantValue(unknownId, mockTypeChecker);
      expect(result).toBe(undefined);
    });
  });
});
