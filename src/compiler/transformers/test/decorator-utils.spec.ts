import ts from 'typescript';

import {
  getDecoratorName,
  getDecoratorParameter,
  getDecoratorParameters,
} from '../decorators-to-static/decorator-utils';

describe('decorator utils', () => {
  describe('getDecoratorParameters', () => {
    it('should return an empty array for decorator with no arguments', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createIdentifier('DecoratorName'),
      } as unknown as ts.Decorator;

      const typeCheckerMock = {} as ts.TypeChecker;
      const result = getDecoratorParameters(decorator, typeCheckerMock);

      expect(result).toEqual([]);
    });

    it('should return correct parameters for decorator with multiple string arguments', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
          ts.factory.createStringLiteral('arg1'),
          ts.factory.createStringLiteral('arg2'),
        ]),
      } as unknown as ts.Decorator;

      const typeCheckerMock = {} as ts.TypeChecker;
      const result = getDecoratorParameters(decorator, typeCheckerMock);

      expect(result).toEqual(['arg1', 'arg2']);
    });

    it('should return enum value for enum member used in decorator', () => {
      const typeCheckerMock = {
        getTypeAtLocation: jest.fn(() => ({
          value: 'arg1',
          isLiteral: () => true,
        })),
      } as unknown as ts.TypeChecker;

      const decorator: ts.Decorator = {
        expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('EnumName'),
            ts.factory.createIdentifier('EnumMemberName'),
          ),
        ]),
      } as unknown as ts.Decorator;

      const result = getDecoratorParameters(decorator, typeCheckerMock);

      expect(result).toEqual(['arg1']);
    });

    describe('enhanced constant resolution', () => {
      it('should resolve string literal types without as const', () => {
        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.StringLiteral,
            value: 'constValue',
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            ts.factory.createIdentifier('CONST_STRING'),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual(['constValue']);
      });

      it('should resolve number literal types', () => {
        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.NumberLiteral,
            value: 42,
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            ts.factory.createIdentifier('CONST_NUMBER'),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual([42]);
      });

      it('should resolve boolean literal types (true)', () => {
        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.BooleanLiteral,
            intrinsicName: 'true',
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            ts.factory.createIdentifier('CONST_TRUE'),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual([true]);
      });

      it('should resolve boolean literal types (false)', () => {
        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.BooleanLiteral,
            intrinsicName: 'false',
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            ts.factory.createIdentifier('CONST_FALSE'),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual([false]);
      });

      it('should resolve single literal from union type (as const pattern)', () => {
        const literalType = {
          flags: ts.TypeFlags.StringLiteral,
          value: 'unionValue',
        };

        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.Union,
            types: [literalType],
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('CONST_OBJ'),
              ts.factory.createIdentifier('PROP'),
            ),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual(['unionValue']);
      });

      it('should throw error for non-literal types with better message', () => {
        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.String, // Generic string type, not literal
          })),
        } as unknown as ts.TypeChecker;

        // Create a proper identifier with getText method
        const identifierNode = ts.factory.createIdentifier('dynamicValue');
        const mockGetText = jest.fn(() => 'dynamicValue');
        (identifierNode as any).getText = mockGetText;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            identifierNode,
          ]),
        } as unknown as ts.Decorator;

        expect(() => getDecoratorParameters(decorator, typeCheckerMock)).toThrow(
          'invalid decorator argument: dynamicValue - must be a string literal, constant, or enum value',
        );
      });

      it('should throw error for union types with multiple literals', () => {
        const literalType1 = {
          flags: ts.TypeFlags.StringLiteral,
          value: 'value1',
        };
        const literalType2 = {
          flags: ts.TypeFlags.StringLiteral,
          value: 'value2',
        };

        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => false,
            flags: ts.TypeFlags.Union,
            types: [literalType1, literalType2],
          })),
        } as unknown as ts.TypeChecker;

        // Create a proper identifier with getText method
        const identifierNode = ts.factory.createIdentifier('ambiguousUnion');
        const mockGetText = jest.fn(() => 'ambiguousUnion');
        (identifierNode as any).getText = mockGetText;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            identifierNode,
          ]),
        } as unknown as ts.Decorator;

        expect(() => getDecoratorParameters(decorator, typeCheckerMock)).toThrow(
          'invalid decorator argument: ambiguousUnion - must be a string literal, constant, or enum value',
        );
      });

      it('should fallback to isLiteral for backward compatibility', () => {
        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => ({
            isLiteral: () => true,
            value: 'literalValue',
            flags: 0, // No specific flags set
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('DecoratorName'), undefined, [
            ts.factory.createIdentifier('enumValue'),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual(['literalValue']);
      });
    });
  });

  describe('getDecoratorName', () => {
    it('should extract name from call expression decorator', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Component'), undefined, []),
      } as unknown as ts.Decorator;

      const result = getDecoratorName(decorator);
      expect(result).toBe('Component');
    });

    it('should extract name from identifier decorator', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createIdentifier('Component'),
      } as unknown as ts.Decorator;

      const result = getDecoratorName(decorator);
      expect(result).toBe('Component');
    });

    it('should return null for complex decorator expressions', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('namespace'),
          ts.factory.createIdentifier('Component'),
        ),
      } as unknown as ts.Decorator;

      const result = getDecoratorName(decorator);
      expect(result).toBe(null);
    });

    it('should handle Event decorator', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Event'), undefined, []),
      } as unknown as ts.Decorator;

      const result = getDecoratorName(decorator);
      expect(result).toBe('Event');
    });

    it('should handle Listen decorator', () => {
      const decorator: ts.Decorator = {
        expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Listen'), undefined, []),
      } as unknown as ts.Decorator;

      const result = getDecoratorName(decorator);
      expect(result).toBe('Listen');
    });
  });

  describe('getDecoratorParameter', () => {
    it('should handle string literals', () => {
      const arg = ts.factory.createStringLiteral('test');
      const typeCheckerMock = {} as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock);
      expect(result).toBe('test');
    });

    it('should handle object literals with constant resolution enabled', () => {
      const arg = ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment('key', ts.factory.createStringLiteral('value')),
      ]);
      const typeCheckerMock = {} as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock, true);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle object literals with constant resolution disabled', () => {
      const arg = ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment('key', ts.factory.createStringLiteral('value')),
      ]);
      const typeCheckerMock = {} as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock, false);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle identifiers with constant resolution enabled', () => {
      const arg = ts.factory.createIdentifier('CONST_VALUE');
      const typeCheckerMock = {
        getTypeAtLocation: jest.fn(() => ({
          isLiteral: () => true,
          value: 'resolvedValue',
        })),
        getSymbolAtLocation: jest.fn((): any => undefined),
      } as unknown as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock, true);
      expect(result).toBe('resolvedValue');
    });

    it('should handle identifiers with constant resolution disabled', () => {
      const arg = ts.factory.createIdentifier('CONST_VALUE');
      const typeCheckerMock = {
        getTypeAtLocation: jest.fn(() => ({
          isLiteral: () => true,
          value: 'resolvedValue',
        })),
      } as unknown as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock, false);
      expect(result).toBe('resolvedValue');
    });

    it('should handle property access expressions', () => {
      const arg = ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('ENUM'),
        ts.factory.createIdentifier('VALUE'),
      );
      const typeCheckerMock = {
        getTypeAtLocation: jest.fn(() => ({
          isLiteral: () => true,
          value: 'enumValue',
        })),
        getSymbolAtLocation: jest.fn((): any => undefined),
      } as unknown as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock);
      expect(result).toBe('enumValue');
    });

    it('should fallback gracefully for constant resolution when it fails', () => {
      const arg = ts.factory.createIdentifier('unknownValue');
      const mockGetText = jest.fn(() => 'unknownValue');
      (arg as any).getText = mockGetText;
      (arg as any).getSourceFile = jest.fn(() => ({ fileName: 'test.ts' }));
      (arg as any).pos = 0;

      const typeCheckerMock = {
        getTypeAtLocation: jest.fn(() => ({
          isLiteral: () => false,
          flags: ts.TypeFlags.String,
        })),
        getSymbolAtLocation: jest.fn((): any => undefined),
      } as unknown as ts.TypeChecker;

      const result = getDecoratorParameter(arg, typeCheckerMock, true);
      expect(result).toBe('unknownValue');
    });
  });
});
