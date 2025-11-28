// Mock the shadow-css module before any imports
jest.mock('@utils/shadow-css', () => {
  const originalModule = jest.requireActual('@utils/shadow-css');
  return {
    ...originalModule,
    scopeCss: jest.fn((cssText: string, scopeId: string) => {
      // Simple mock implementation that adds scoped classes
      return cssText.replace(/(\.[a-zA-Z-_][a-zA-Z0-9-_]*)/g, `$1.${scopeId}`);
    }),
  };
});

import { mockBuildCtx } from '@stencil/core/testing';
import ts from 'typescript';
import type * as d from '../../../declarations';
import {
  addStaticStyleGetterWithinClass,
  addStaticStylePropertyToClass,
  createStyleIdentifier,
} from '../add-static-style';

describe('add-static-style', () => {
  let buildCtx: d.BuildCtx;
  let mockComponent: d.ComponentCompilerMeta;
  let printer: ts.Printer;
  let sourceFile: ts.SourceFile;

  beforeEach(() => {
    buildCtx = mockBuildCtx();
    buildCtx.config.extras = { additionalTagTransformers: false };

    mockComponent = {
      componentClassName: 'MyComponent',
      tagName: 'my-component',
      encapsulation: 'none',
      styles: [],
    } as d.ComponentCompilerMeta;

    printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015);
  });

  describe('addStaticStyleGetterWithinClass', () => {
    it('should add static style getter for single inline style', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        } as d.StyleCompiler,
      ];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);

      const getter = classMembers[0] as ts.GetAccessorDeclaration;
      expect(ts.isIdentifier(getter.name)).toBe(true);
      expect((getter.name as ts.Identifier).text).toBe('style');
      expect(getter.modifiers).toBeDefined();
      expect(getter.modifiers!.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)).toBe(true);

      // Check actual output
      const output = printer.printNode(ts.EmitHint.Unspecified, getter, sourceFile);
      expect(output).toContain('static get style()');
      expect(output).toContain('md: `.my-component { color: red; }`');
    });

    it('should add static style getter for multiple style modes', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        },
        {
          modeName: 'ios',
          styleStr: '.my-component { color: blue; }',
        },
      ] as d.StyleCompiler[];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);

      // Check actual output
      const getter = classMembers[0] as ts.GetAccessorDeclaration;
      const output = printer.printNode(ts.EmitHint.Unspecified, getter, sourceFile);
      expect(output).toContain('static get style()');
      expect(output).toContain('md:');
      expect(output).toContain('ios:');
      expect(output).toContain('.my-component { color: red; }');
      expect(output).toContain('.my-component { color: blue; }');
    });

    it('should add static style getter for external style URLs', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          externalStyles: [{ absolutePath: '/path/to/style.css' }],
        } as d.StyleCompiler,
      ];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);

      // Check actual output
      const getter = classMembers[0] as ts.GetAccessorDeclaration;
      const output = printer.printNode(ts.EmitHint.Unspecified, getter, sourceFile);
      expect(output).toContain('static get style()');
      expect(output).toContain('md: MyComponentMdStyle0');
    });

    it('should add static style getter for direct style identifier', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleIdentifier: 'myImportedStyle',
        } as d.StyleCompiler,
      ];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);
    });

    it('should not add getter when no styles are provided', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(0);
    });

    it('should handle scoped encapsulation', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.encapsulation = 'scoped';
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        } as d.StyleCompiler,
      ];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);

      // Check actual output - should include scoped CSS
      const getter = classMembers[0] as ts.GetAccessorDeclaration;
      const output = printer.printNode(ts.EmitHint.Unspecified, getter, sourceFile);
      expect(output).toContain('static get style()');
      // Should contain the scoped class name from our mock
      expect(output).toContain('.sc-my-component-md');
    });
  });

  describe('addStaticStylePropertyToClass', () => {
    it('should add static style property assignment for single inline style', () => {
      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        } as d.StyleCompiler,
      ];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(1);
      expect(ts.isExpressionStatement(styleStatements[0])).toBe(true);

      const statement = styleStatements[0] as ts.ExpressionStatement;
      expect(ts.isBinaryExpression(statement.expression)).toBe(true);

      const assignment = statement.expression as ts.BinaryExpression;
      expect(assignment.operatorToken.kind).toBe(ts.SyntaxKind.EqualsToken);

      // Check actual output
      const output = printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
      expect(output).toContain('MyComponent.style = {');
      expect(output).toContain('md: `.my-component { color: red; }`');
    });

    it('should add static style property for multiple style modes', () => {
      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        },
        {
          modeName: 'ios',
          styleStr: '.my-component { color: blue; }',
        },
      ] as d.StyleCompiler[];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(1);
      expect(ts.isExpressionStatement(styleStatements[0])).toBe(true);

      // Check actual output
      const statement = styleStatements[0] as ts.ExpressionStatement;
      const output = printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
      expect(output).toContain('MyComponent.style = {');
      expect(output).toContain('md:');
      expect(output).toContain('ios:');
      expect(output).toContain('.my-component { color: red; }');
      expect(output).toContain('.my-component { color: blue; }');
    });

    it('should add static style property for external style URLs', () => {
      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          externalStyles: [{ absolutePath: '/path/to/style.css' }],
        } as d.StyleCompiler,
      ];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(1);
      expect(ts.isExpressionStatement(styleStatements[0])).toBe(true);

      // Check actual output
      const statement = styleStatements[0] as ts.ExpressionStatement;
      const output = printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
      expect(output).toContain('MyComponent.style = {');
      expect(output).toContain('md: MyComponentMdStyle0');
    });

    it('should add static style property for direct style identifier', () => {
      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleIdentifier: 'myImportedStyle',
        } as d.StyleCompiler,
      ];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(1);
      expect(ts.isExpressionStatement(styleStatements[0])).toBe(true);
    });

    it('should not add statement when no styles are provided', () => {
      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(0);
    });

    it('should handle scoped encapsulation', () => {
      const styleStatements: ts.Statement[] = [];
      mockComponent.encapsulation = 'scoped';
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        } as d.StyleCompiler,
      ];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(1);
      expect(ts.isExpressionStatement(styleStatements[0])).toBe(true);
    });

    it('should handle tag transform configuration', () => {
      buildCtx.config.extras.additionalTagTransformers = true;
      buildCtx.components = [{ tagName: 'other-component' }] as d.ComponentCompilerMeta[];

      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; } other-component { color: blue; }',
        } as d.StyleCompiler,
      ];

      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(styleStatements).toHaveLength(1);
      expect(ts.isExpressionStatement(styleStatements[0])).toBe(true);

      // Check actual output - should include tag transformation logic
      const statement = styleStatements[0] as ts.ExpressionStatement;
      const output = printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile);
      expect(output).toContain('MyComponent.style = {');
      expect(output).toContain(
        'md: `.my-component { color: red; } ${__stencil_transformTag("other-component")} { color: blue; }`',
      );
    });
  });

  describe('createStyleIdentifier', () => {
    it('should create style identifier with default mode', () => {
      const style: d.StyleCompiler = {
        modeName: 'md',
        externalStyles: [{ absolutePath: '/path/to/style.css' }],
      } as d.StyleCompiler;

      const result = createStyleIdentifier(mockComponent, style);

      expect(style.styleIdentifier).toBe('MyComponentMdStyle');
      expect(ts.isCallExpression(result)).toBe(true);

      // Check actual output
      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe('MyComponentMdStyle0()');
    });

    it('should create style identifier with custom mode', () => {
      const style: d.StyleCompiler = {
        modeName: 'ios',
        externalStyles: [{ absolutePath: '/path/to/style.css' }],
      } as d.StyleCompiler;

      const result = createStyleIdentifier(mockComponent, style);

      expect(style.styleIdentifier).toBe('MyComponentIosStyle');
      expect(ts.isCallExpression(result)).toBe(true);
    });

    it('should create binary expression for multiple external styles', () => {
      const style: d.StyleCompiler = {
        modeName: 'md',
        externalStyles: [{ absolutePath: '/path/to/style1.css' }, { absolutePath: '/path/to/style2.css' }],
      } as d.StyleCompiler;

      const result = createStyleIdentifier(mockComponent, style);

      expect(style.styleIdentifier).toBe('MyComponentMdStyle');
      // MyComponentMdStyle0() + MyComponentMdStyle1()
      expect(ts.isBinaryExpression(result)).toBe(true);

      // Check actual output
      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe('MyComponentMdStyle0() + MyComponentMdStyle1()');
    });

    it('should handle component with dashes in tag name', () => {
      mockComponent.tagName = 'my-custom-component';
      const style: d.StyleCompiler = {
        modeName: 'md',
        externalStyles: [{ absolutePath: '/path/to/style.css' }],
      } as d.StyleCompiler;

      const result = createStyleIdentifier(mockComponent, style);

      expect(style.styleIdentifier).toBe('MyCustomComponentMdStyle');
      expect(ts.isCallExpression(result)).toBe(true);
    });

    it('should handle component with uppercase tag name', () => {
      mockComponent.tagName = 'MY-COMPONENT';
      const style: d.StyleCompiler = {
        modeName: 'md',
        externalStyles: [{ absolutePath: '/path/to/style.css' }],
      } as d.StyleCompiler;

      const result = createStyleIdentifier(mockComponent, style);

      expect(style.styleIdentifier).toBe('MyComponentMdStyle');
      expect(ts.isCallExpression(result)).toBe(true);
    });

    it('should handle multiple external styles with complex binary expression', () => {
      const style: d.StyleCompiler = {
        modeName: 'ios',
        externalStyles: [
          { absolutePath: '/path/to/style1.css' },
          { absolutePath: '/path/to/style2.css' },
          { absolutePath: '/path/to/style3.css' },
        ],
      } as d.StyleCompiler;

      const result = createStyleIdentifier(mockComponent, style);

      expect(style.styleIdentifier).toBe('MyComponentIosStyle');
      // MyComponentIosStyle0() + MyComponentIosStyle1() + MyComponentIosStyle2()
      expect(ts.isBinaryExpression(result)).toBe(true);

      let binaryExpr = result as ts.BinaryExpression;
      expect(binaryExpr.operatorToken.kind).toBe(ts.SyntaxKind.PlusToken);
      // Check that the right side is also a binary expression (nested)
      let rightBinary = binaryExpr.right;
      // If rightBinary is a CallExpression, check if its callee is a ParenthesizedExpression wrapping a BinaryExpression
      if (ts.isCallExpression(rightBinary)) {
        const callExpr = rightBinary;
        if (ts.isParenthesizedExpression(callExpr.expression)) {
          const inner = callExpr.expression.expression;
          if (ts.isBinaryExpression(inner)) {
            rightBinary = inner;
          }
        }
      }

      // Check actual output
      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe('MyComponentIosStyle0() + (MyComponentIosStyle1() + MyComponentIosStyle2())');
    });
  });

  describe('integration scenarios', () => {
    it('should handle component with no styles gracefully', () => {
      const classMembers: ts.ClassElement[] = [];
      const styleStatements: ts.Statement[] = [];
      mockComponent.styles = [];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);
      addStaticStylePropertyToClass(styleStatements, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(0);
      expect(styleStatements).toHaveLength(0);
    });

    it('should handle component with mixed style types', () => {
      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; }',
        },
        {
          modeName: 'ios',
          externalStyles: [{ absolutePath: '/path/to/ios.css' }],
        },
        {
          modeName: 'dark',
          styleIdentifier: 'darkModeStyle',
        },
      ] as d.StyleCompiler[];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);

      // Check actual output - should handle mixed style types
      const getter = classMembers[0] as ts.GetAccessorDeclaration;
      const output = printer.printNode(ts.EmitHint.Unspecified, getter, sourceFile);
      expect(output).toContain('static get style()');
      expect(output).toContain('md: `.my-component { color: red; }`');
      expect(output).toContain('ios: MyComponentIosStyle0');
      expect(output).toContain('dark: darkModeStyle');
    });

    it('should handle tag transform configuration', () => {
      buildCtx.config.extras.additionalTagTransformers = true;
      buildCtx.components = [{ tagName: 'other-component' }] as d.ComponentCompilerMeta[];

      const classMembers: ts.ClassElement[] = [];
      mockComponent.styles = [
        {
          modeName: 'md',
          styleStr: '.my-component { color: red; } other-component { color: blue; }',
        } as d.StyleCompiler,
      ];

      addStaticStyleGetterWithinClass(classMembers, mockComponent, buildCtx);

      expect(classMembers).toHaveLength(1);
      expect(ts.isGetAccessorDeclaration(classMembers[0])).toBe(true);

      // Check actual output - should include tag transformation logic
      const getter = classMembers[0] as ts.GetAccessorDeclaration;
      const output = printer.printNode(ts.EmitHint.Unspecified, getter, sourceFile);
      expect(output).toContain('static get style()');
      expect(output).toContain(
        'md: `.my-component { color: red; } ${__stencil_transformTag("other-component")} { color: blue; }`',
      );
    });
  });
});
