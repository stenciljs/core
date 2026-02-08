import ts from 'typescript';

import { getDecoratorParameters } from '../decorators-to-static/decorator-utils';

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

    describe('resolveVar', () => {
      it('should resolve const variable with string literal', () => {
        const myEventIdentifier = ts.factory.createIdentifier('MY_EVENT');
        const variableDeclaration = ts.factory.createVariableDeclaration(
          myEventIdentifier,
          undefined,
          undefined,
          ts.factory.createStringLiteral('myEvent'),
        );

        const symbolMock = {
          valueDeclaration: variableDeclaration,
        };

        const typeCheckerMock = {
          getSymbolAtLocation: jest.fn(() => symbolMock),
          getTypeAtLocation: jest.fn(() => ({
            value: 'myEvent',
            isLiteral: () => true,
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Listen'), undefined, [
            ts.factory.createCallExpression(ts.factory.createIdentifier('resolveVar'), undefined, [myEventIdentifier]),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual(['myEvent']);
      });

      it('should resolve const variable with as const assertion', () => {
        const myEventIdentifier = ts.factory.createIdentifier('MY_EVENT');
        const variableDeclaration = ts.factory.createVariableDeclaration(
          myEventIdentifier,
          undefined,
          undefined,
          ts.factory.createStringLiteral('myEvent'),
        );

        const symbolMock = {
          valueDeclaration: variableDeclaration,
        };

        const typeCheckerMock = {
          getSymbolAtLocation: jest.fn(() => symbolMock),
          getTypeAtLocation: jest.fn(() => ({
            value: 'myEvent',
            isLiteral: () => true,
          })),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Listen'), undefined, [
            ts.factory.createCallExpression(ts.factory.createIdentifier('resolveVar'), undefined, [myEventIdentifier]),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual(['myEvent']);
      });

      it('should resolve object property', () => {
        const eventsIdentifier = ts.factory.createIdentifier('EVENTS');
        const myEventProperty = ts.factory.createPropertyAccessExpression(eventsIdentifier, 'MY_EVENT');

        const propertySymbolMock = {
          valueDeclaration: ts.factory.createPropertyDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            'MY_EVENT',
            undefined,
            undefined,
            ts.factory.createStringLiteral('myEvent'),
          ),
        };

        const objectTypeMock = {
          // Mock object type
        };

        const propertyTypeMock = {
          value: 'myEvent',
          isLiteral: () => true,
        };

        const typeCheckerMock = {
          getTypeAtLocation: jest.fn((node) => {
            if (node === eventsIdentifier) {
              return objectTypeMock;
            }
            return propertyTypeMock;
          }),
          getPropertyOfType: jest.fn(() => propertySymbolMock),
          getTypeOfSymbolAtLocation: jest.fn(() => propertyTypeMock),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Listen'), undefined, [
            ts.factory.createCallExpression(ts.factory.createIdentifier('resolveVar'), undefined, [myEventProperty]),
          ]),
        } as unknown as ts.Decorator;

        const result = getDecoratorParameters(decorator, typeCheckerMock);

        expect(result).toEqual(['myEvent']);
      });

      it('should throw error for non-resolvable variable', () => {
        const myEventIdentifier = ts.factory.createIdentifier('MY_EVENT');

        const typeCheckerMock = {
          getSymbolAtLocation: jest.fn((): ts.Symbol | undefined => undefined),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Listen'), undefined, [
            ts.factory.createCallExpression(ts.factory.createIdentifier('resolveVar'), undefined, [myEventIdentifier]),
          ]),
        } as unknown as ts.Decorator;

        const diagnostics: any[] = [];

        expect(() => {
          getDecoratorParameters(decorator, typeCheckerMock, diagnostics);
        }).toThrow();

        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].level).toBe('error');
      });

      it('should throw error for non-existent object property', () => {
        const eventsIdentifier = ts.factory.createIdentifier('EVENTS');
        const myEventProperty = ts.factory.createPropertyAccessExpression(eventsIdentifier, 'MY_EVENT');

        const objectTypeMock = {};

        const typeCheckerMock = {
          getTypeAtLocation: jest.fn(() => objectTypeMock),
          getPropertyOfType: jest.fn((): ts.Symbol | undefined => undefined),
        } as unknown as ts.TypeChecker;

        const decorator: ts.Decorator = {
          expression: ts.factory.createCallExpression(ts.factory.createIdentifier('Listen'), undefined, [
            ts.factory.createCallExpression(ts.factory.createIdentifier('resolveVar'), undefined, [myEventProperty]),
          ]),
        } as unknown as ts.Decorator;

        const diagnostics: any[] = [];

        expect(() => {
          getDecoratorParameters(decorator, typeCheckerMock, diagnostics);
        }).toThrow();

        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].level).toBe('error');
      });
    });
  });
});
