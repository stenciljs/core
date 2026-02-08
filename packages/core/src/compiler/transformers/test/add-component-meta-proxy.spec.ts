import ts from 'typescript';

import { stubComponentCompilerMeta } from '../../../compiler/types/tests/ComponentCompilerMeta.stub';
import type * as d from '../../../declarations';
import * as FormatComponentRuntimeMeta from '../../../utils/format-component-runtime-meta';
import { createClassMetadataProxy } from '../add-component-meta-proxy';
import { HTML_ELEMENT } from '../core-runtime-apis';
import * as TransformUtils from '../transform-utils';

describe('add-component-meta-proxy', () => {
  describe('createClassMetadataProxy()', () => {
    let classExpr: ts.ClassExpression;
    let htmlElementHeritageClause: ts.HeritageClause;
    let literalMetadata: ts.StringLiteral;

    let formatComponentRuntimeMetaSpy: jest.SpyInstance<
      ReturnType<typeof FormatComponentRuntimeMeta.formatComponentRuntimeMeta>,
      Parameters<typeof FormatComponentRuntimeMeta.formatComponentRuntimeMeta>
    >;
    let convertValueToLiteralSpy: jest.SpyInstance<
      ReturnType<typeof TransformUtils.convertValueToLiteral>,
      Parameters<typeof TransformUtils.convertValueToLiteral>
    >;

    beforeEach(() => {
      htmlElementHeritageClause = ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier(HTML_ELEMENT), []),
      ]);

      classExpr = ts.factory.createClassExpression(
        undefined,
        'MyComponent',
        undefined,
        [htmlElementHeritageClause],
        [],
      );
      literalMetadata = ts.factory.createStringLiteral('MyComponent');

      formatComponentRuntimeMetaSpy = jest.spyOn(FormatComponentRuntimeMeta, 'formatComponentRuntimeMeta');
      formatComponentRuntimeMetaSpy.mockImplementation(
        (_compilerMeta: d.ComponentCompilerMeta, _includeMethods: boolean) => [0, 'tag-name'],
      );

      convertValueToLiteralSpy = jest.spyOn(TransformUtils, 'convertValueToLiteral');
      convertValueToLiteralSpy.mockImplementation((_compactMeta: d.ComponentRuntimeMetaCompact) => literalMetadata);
    });

    afterEach(() => {
      formatComponentRuntimeMetaSpy.mockRestore();
      convertValueToLiteralSpy.mockRestore();
    });

    it('returns a call expression', () => {
      const result: ts.CallExpression = createClassMetadataProxy(stubComponentCompilerMeta(), classExpr);

      expect(ts.isCallExpression(result)).toBe(true);
    });

    it('wraps the initializer in PROXY_CUSTOM_ELEMENT', () => {
      const result: ts.CallExpression = createClassMetadataProxy(stubComponentCompilerMeta(), classExpr);

      expect((result.expression as ts.Identifier).escapedText).toBe('___stencil_proxyCustomElement');
    });

    it("doesn't add any type arguments to the call", () => {
      const result: ts.CallExpression = createClassMetadataProxy(stubComponentCompilerMeta(), classExpr);

      expect(result.typeArguments).toHaveLength(0);
    });

    it('adds the correct arguments to the PROXY_CUSTOM_ELEMENT call', () => {
      const result: ts.CallExpression = createClassMetadataProxy(stubComponentCompilerMeta(), classExpr);

      expect(result.arguments).toHaveLength(2);
      expect(result.arguments[0]).toBe(classExpr);
      expect(result.arguments[1]).toBe(literalMetadata);
    });

    it('includes the heritage clause', () => {
      const result: ts.CallExpression = createClassMetadataProxy(stubComponentCompilerMeta(), classExpr);

      expect(result.arguments.length).toBeGreaterThanOrEqual(1);
      const createdClassExpression = result.arguments[0];

      expect(ts.isClassExpression(createdClassExpression)).toBe(true);
      expect((createdClassExpression as ts.ClassExpression).heritageClauses).toHaveLength(1);
      expect((createdClassExpression as ts.ClassExpression).heritageClauses[0]).toBe(htmlElementHeritageClause);
    });
  });
});
