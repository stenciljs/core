import * as ts from 'typescript';

import {
  addTagTransformToCssString,
  addTagTransformToCssTsAST,
  isMemberPrivate,
  mapJSDocTagInfo,
  parseDocsType,
  resolveType,
  retrieveModifierLike,
  retrieveTsDecorators,
  retrieveTsModifiers,
  updateConstructor,
} from '../transform-utils';

describe('transform-utils', () => {
  it('flattens TypeScript JSDocTagInfo to Stencil JSDocTagInfo', () => {
    // tags corresponds to the following JSDoc
    /*
     * @param foo the first parameter
     * @param bar
     * @returns
     * @see {@link https://example.com}
     */
    const tags = [
      {
        name: 'param',
        text: [
          { text: 'foo', kind: 'parameterName' },
          { text: ' ', kind: 'space' },
          { text: 'the first parameter', kind: 'text' },
        ],
      },
      { name: 'param', text: [{ text: 'bar', kind: 'text' }] },
      { name: 'returns', text: undefined },
      {
        name: 'see',
        text: [
          { text: '', kind: 'text' },
          { text: '{@link ', kind: 'link' },
          { text: 'https://example.com', kind: 'linkText' },
          { text: '}', kind: 'link' },
        ],
      },
    ];

    expect(mapJSDocTagInfo(tags)).toEqual([
      { name: 'param', text: 'foo the first parameter' },
      { name: 'param', text: 'bar' },
      { name: 'returns', text: undefined },
      { name: 'see', text: '{@link https://example.com}' },
    ]);
  });

  /**
   * Helper method for creating an empty method named 'myMethod' with the provided modifiers.
   *
   * @example
   * // By default, no modifiers will be applied, and the following will be returned:
   * createMemberWithModifiers(); // myMethod() {}
   *
   * // Otherwise, the provided modifiers will be applied to the method:
   * createMemberWithModifiers([ts.factory.createModifier(ts.SyntaxKind.PrivateKeyword)]); // private myMethod() {}
   *
   * @param modifiers the modifiers to apply to the method. Defaults to applying no modifiers if none are provided
   * @returns a new empty method
   */
  const createMemberWithModifiers = (
    modifiers: ReadonlyArray<ts.ModifierLike> | undefined = undefined,
  ): ts.MethodDeclaration => {
    return ts.factory.createMethodDeclaration(
      modifiers,
      undefined,
      ts.factory.createIdentifier('myMethod'),
      undefined,
      undefined,
      [],
      undefined,
      ts.factory.createBlock([], false),
    );
  };

  describe('isMemberPrivate', () => {
    it('returns false when the member has no modifiers', () => {
      const methodDeclaration = createMemberWithModifiers();

      expect(isMemberPrivate(methodDeclaration)).toBe(false);
    });

    it('returns false when the member has a non-private modifier', () => {
      const methodDeclaration = createMemberWithModifiers([ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)]);

      expect(isMemberPrivate(methodDeclaration)).toBe(false);
    });

    it.each<[string, ts.ModifierSyntaxKind]>([
      ['private', ts.SyntaxKind.PrivateKeyword],
      ['protected', ts.SyntaxKind.ProtectedKeyword],
    ])('returns true when the member has a (%s) modifier', (_name, modifier) => {
      const methodDeclaration = createMemberWithModifiers([ts.factory.createModifier(modifier)]);

      expect(isMemberPrivate(methodDeclaration)).toBe(true);
    });
  });

  describe('retrieveModifierLike', () => {
    it("returns an empty array when no ModifierLike's are present", () => {
      const methodDeclaration = createMemberWithModifiers();

      expect(retrieveModifierLike(methodDeclaration)).toEqual([]);
    });

    it('returns all decorators and modifiers on a node', () => {
      const privateModifier = ts.factory.createModifier(ts.SyntaxKind.PrivateKeyword);
      const nonSenseDecorator = ts.factory.createDecorator(ts.factory.createStringLiteral('NonSenseDecorator'));

      const methodDeclaration = createMemberWithModifiers([privateModifier, nonSenseDecorator]);
      const modifierLikes = retrieveModifierLike(methodDeclaration);

      expect(modifierLikes).toHaveLength(2);
      expect(modifierLikes).toContain(privateModifier);
      expect(modifierLikes).toContain(nonSenseDecorator);
    });
  });

  describe('retrieveTsDecorators', () => {
    it('returns undefined when a node cannot have decorators', () => {
      const node = ts.factory.createNumericLiteral(123);

      const decorators = retrieveTsDecorators(node);

      expect(decorators).toEqual(undefined);
    });

    it('returns undefined when a node has undefined decorators', () => {
      // create a class declaration with name 'MyClass' and no decorators
      const node = ts.factory.createClassDeclaration(undefined, 'MyClass', undefined, undefined, []);

      const decorators = retrieveTsDecorators(node);

      expect(decorators).toEqual(undefined);
    });

    it('returns undefined when a node has no decorators', () => {
      // create a class declaration with name 'MyClass' and no decorators
      const node = ts.factory.createClassDeclaration([], 'MyClass', undefined, undefined, []);

      const decorators = retrieveTsDecorators(node);

      expect(decorators).toEqual(undefined);
    });

    it("returns a node's decorators", () => {
      const initialDecorators = [
        // no-op decorator, but it's good enough for testing purposes
        ts.factory.createDecorator(ts.factory.createStringLiteral('NonSenseDecorator')),
      ];

      // create a class declaration with name 'MyClass' and a decorator
      const node = ts.factory.createClassDeclaration(initialDecorators, 'MyClass', undefined, undefined, []);

      const decorators = retrieveTsDecorators(node);

      expect(decorators).toHaveLength(1);
      expect(decorators![0]).toEqual(initialDecorators[0]);
    });
  });

  describe('retrieveTsModifiers', () => {
    it('returns undefined when a node cannot have modifiers', () => {
      const node = ts.factory.createNumericLiteral(123);

      const modifiers = retrieveTsModifiers(node);

      expect(modifiers).toEqual(undefined);
    });

    it('returns undefined when a node has undefined modifiers', () => {
      // create a class declaration with name 'MyClass' and no modifiers
      const node = ts.factory.createClassDeclaration(undefined, 'MyClass', undefined, undefined, []);

      const modifiers = retrieveTsModifiers(node);

      expect(modifiers).toEqual(undefined);
    });

    it('returns undefined when a node has no modifiers', () => {
      // create a class declaration with name 'MyClass' and no modifiers
      const node = ts.factory.createClassDeclaration([], 'MyClass', undefined, undefined, []);

      const modifiers = retrieveTsModifiers(node);

      expect(modifiers).toEqual(undefined);
    });

    it("returns a node's modifiers", () => {
      const initialModifiers = [ts.factory.createModifier(ts.SyntaxKind.AbstractKeyword)];

      // create a class declaration with name 'MyClass' and a 'abstract' modifier
      const node = ts.factory.createClassDeclaration(initialModifiers, 'MyClass', undefined, undefined, []);

      const modifiers = retrieveTsModifiers(node);

      expect(modifiers).toHaveLength(1);
      expect(modifiers![0]).toEqual(initialModifiers[0]);
    });
  });

  describe('updateConstructor', () => {
    function printClassMembers(classNode: ts.ClassDeclaration, classMembers: ts.ClassElement[]) {
      const updatedClass = ts.factory.updateClassDeclaration(
        classNode,
        classNode.modifiers,
        classNode.name,
        classNode.typeParameters,
        classNode.heritageClauses,
        classMembers,
      );
      const printer: ts.Printer = ts.createPrinter();
      let sourceFile = ts.createSourceFile('dummy.ts', '', ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
      sourceFile = ts.factory.updateSourceFile(sourceFile, [updatedClass]);
      return printer.printFile(sourceFile).replace(/\n/g, '').replace(/    /g, ' ');
    }

    it('returns the same constructor when no parameters are provided', () => {
      const classNode = ts.factory.createClassDeclaration([], 'MyClass', undefined, undefined, [
        ts.factory.createConstructorDeclaration([], [], ts.factory.createBlock([], false)),
      ]);
      const updatedMembers = updateConstructor(classNode, Array.from(classNode.members), []);

      expect(printClassMembers(classNode, updatedMembers)).toBe(`class MyClass { constructor() { }}`);
    });

    it('adds a constructor when none is present and statements are provided', () => {
      const ctorStatements = [ts.factory.createExpressionStatement(ts.factory.createIdentifier('someMethod()'))];

      const classNode = ts.factory.createClassDeclaration([], 'MyClass', undefined, undefined, [
        ts.factory.createMethodDeclaration(
          [],
          undefined,
          ts.factory.createIdentifier('myMethod'),
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createBlock([], false),
        ),
        ts.factory.createPropertyDeclaration(
          [],
          ts.factory.createIdentifier('myProperty'),
          undefined,
          undefined,
          undefined,
        ),
      ]);

      const updatedMembers = updateConstructor(classNode, Array.from(classNode.members), ctorStatements);

      expect(printClassMembers(classNode, updatedMembers)).toBe(
        `class MyClass { constructor() {  someMethod(); } myMethod() { } myProperty;}`,
      );
    });

    it('adds super call when class extends another class', () => {
      const classNode = ts.factory.createClassDeclaration(
        [],
        'MyClass',
        undefined,
        [
          ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
            ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('BaseClass'), []),
          ]),
        ],
        [ts.factory.createConstructorDeclaration([], [], ts.factory.createBlock([], false))],
      );

      expect(printClassMembers(classNode, updateConstructor(classNode, Array.from(classNode.members), []))).toBe(
        `class MyClass extends BaseClass { constructor() { super(); }}`,
      );
    });

    it('makes sure super call is the first statement in the constructor body', () => {
      const classNode = ts.factory.createClassDeclaration(
        [],
        'MyClass',
        undefined,
        [
          ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
            ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('BaseClass'), []),
          ]),
        ],
        [
          ts.factory.createConstructorDeclaration(
            [],
            [],
            ts.factory.createBlock(
              [ts.factory.createExpressionStatement(ts.factory.createIdentifier('someMethod()'))],
              false,
            ),
          ),
        ],
      );

      expect(printClassMembers(classNode, updateConstructor(classNode, Array.from(classNode.members), []))).toBe(
        `class MyClass extends BaseClass { constructor() { super(); someMethod(); }}`,
      );
    });

    it('adds false argument to super call when no parameters are provided', () => {
      const classNode = ts.factory.createClassDeclaration(
        [],
        'MyClass',
        undefined,
        [
          ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
            ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('BaseClass'), []),
          ]),
        ],
        [ts.factory.createConstructorDeclaration([], [], ts.factory.createBlock([], false))],
      );

      expect(
        printClassMembers(classNode, updateConstructor(classNode, Array.from(classNode.members), [], [], true)),
      ).toBe(`class MyClass extends BaseClass { constructor() { super(false); }}`);
    });
  });

  describe('addTagTransformToCssString', () => {
    it('should transform tag selectors to placeholder syntax', () => {
      const cssCode = 'my-component { color: red; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe('${__stencil_transformTag("my-component")} { color: red; }');
    });

    it('should transform multiple tag selectors', () => {
      const cssCode = 'my-component { color: red; } other-component { color: blue; }';
      const tagNames = ['my-component', 'other-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe(
        '${__stencil_transformTag("my-component")} { color: red; } ${__stencil_transformTag("other-component")} { color: blue; }',
      );
    });

    it('should only transform specified tag names', () => {
      const cssCode = 'my-component { color: red; } other-component { color: blue; } .class { color: green; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe(
        '${__stencil_transformTag("my-component")} { color: red; } other-component { color: blue; } .class { color: green; }',
      );
    });

    it('should handle complex selectors with tag names', () => {
      const cssCode = 'my-component.active { color: red; } my-component:hover { color: blue; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe(
        '${__stencil_transformTag("my-component")}.active { color: red; } ${__stencil_transformTag("my-component")}:hover { color: blue; }',
      );
    });

    it('should handle descendant selectors', () => {
      const cssCode = 'parent-component my-component { color: red; }';
      const tagNames = ['my-component', 'parent-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe(
        '${__stencil_transformTag("parent-component")} ${__stencil_transformTag("my-component")} { color: red; }',
      );
    });

    it('should return original CSS when no tag names match', () => {
      const cssCode = '.class { color: red; } #id { color: blue; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe('.class { color: red; } #id { color: blue; }');
    });

    it('should handle empty tag names array', () => {
      const cssCode = 'my-component { color: red; }';
      const tagNames: string[] = [];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe('my-component { color: red; }');
    });

    it('should handle attribute selectors with tag names', () => {
      const cssCode = 'my-component[active] { color: red; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssString(cssCode, tagNames);

      expect(result).toBe('${__stencil_transformTag("my-component")}[active] { color: red; }');
    });
  });

  describe('addTagTransformToCssTsAST', () => {
    let printer: ts.Printer;
    let sourceFile: ts.SourceFile;

    beforeEach(() => {
      printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015);
    });

    it('should return NoSubstitutionTemplateLiteral when no tags are found', () => {
      const cssCode = '.class { color: red; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isNoSubstitutionTemplateLiteral(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe('`.class { color: red; }`');
    });

    it('should return TemplateExpression with tag transform calls', () => {
      const cssCode = 'my-component { color: red; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isTemplateExpression(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe('`${__stencil_transformTag("my-component")} { color: red; }`');
    });

    it('should handle multiple tag transformations', () => {
      const cssCode = 'my-component { color: red; } other-component { color: blue; }';
      const tagNames = ['my-component', 'other-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isTemplateExpression(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe(
        '`${__stencil_transformTag("my-component")} { color: red; } ${__stencil_transformTag("other-component")} { color: blue; }`',
      );
    });

    it('should handle complex selectors with mixed content', () => {
      const cssCode = '.class { color: green; } my-component:hover { color: red; } #id { color: yellow; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isTemplateExpression(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe(
        '`.class { color: green; } ${__stencil_transformTag("my-component")}:hover { color: red; } #id { color: yellow; }`',
      );
    });

    it('should handle descendant selectors', () => {
      const cssCode = 'parent-component my-component { color: red; }';
      const tagNames = ['my-component', 'parent-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isTemplateExpression(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe(
        '`${__stencil_transformTag("parent-component")} ${__stencil_transformTag("my-component")} { color: red; }`',
      );
    });

    it('should handle tag names that appear multiple times', () => {
      const cssCode = 'my-component { color: red; } my-component.active { color: blue; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isTemplateExpression(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe(
        '`${__stencil_transformTag("my-component")} { color: red; } ${__stencil_transformTag("my-component")}.active { color: blue; }`',
      );
    });

    it('should handle empty tag names array', () => {
      const cssCode = 'my-component { color: red; }';
      const tagNames: string[] = [];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isNoSubstitutionTemplateLiteral(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toBe('`my-component { color: red; }`');
    });

    it('should handle CSS with newlines and formatting', () => {
      const cssCode = `my-component {
  color: red;
  margin: 10px;
}`;
      const tagNames = ['my-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      expect(ts.isTemplateExpression(result)).toBe(true);

      const output = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);
      expect(output).toContain('__stencil_transformTag("my-component")');
      expect(output).toContain('color: red');
      expect(output).toContain('margin: 10px');
    });

    it('should create proper TemplateSpan structure', () => {
      const cssCode = 'my-component { color: red; }';
      const tagNames = ['my-component'];

      const result = addTagTransformToCssTsAST(cssCode, tagNames);

      if (ts.isTemplateExpression(result)) {
        expect(result.templateSpans).toHaveLength(1);

        const span = result.templateSpans[0];
        expect(ts.isCallExpression(span.expression)).toBe(true);

        const callExpr = span.expression as ts.CallExpression;
        expect(ts.isIdentifier(callExpr.expression)).toBe(true);
        expect((callExpr.expression as ts.Identifier).text).toBe('__stencil_transformTag');
        expect(callExpr.arguments).toHaveLength(1);
        expect(ts.isStringLiteral(callExpr.arguments[0])).toBe(true);
        expect((callExpr.arguments[0] as ts.StringLiteral).text).toBe('my-component');
      } else {
        throw new Error('Expected TemplateExpression but got different node type');
      }
    });
  });

  describe('resolveType and parseDocsType', () => {
    /**
     * Helper to create a minimal compiler host for testing
     * @param sourceFile the TypeScript source file under test
     * @returns a minimal compiler host for the provided source file
     */
    const createTestCompilerHost = (sourceFile: ts.SourceFile): ts.CompilerHost => ({
      getSourceFile: (fileName) => (fileName === 'test.ts' ? sourceFile : undefined),
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getDefaultLibFileName: () => 'lib.d.ts',
    });

    describe('type alias expansion', () => {
      it('should expand non-generic type aliases to their literal values', () => {
        // Create a simple type alias: type ColorName = "red" | "green" | "blue"
        const sourceCode = `
          type ColorName = "red" | "green" | "blue";
          const color: ColorName = "red";
        `;

        const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.ES2015, true);
        const program = ts.createProgram(['test.ts'], {}, createTestCompilerHost(sourceFile));
        const checker = program.getTypeChecker();

        // Get the type of the 'color' variable
        const variableStatement = sourceFile.statements[1] as ts.VariableStatement;
        const variableDeclaration = variableStatement.declarationList.declarations[0];
        const type = checker.getTypeAtLocation(variableDeclaration);

        const result = resolveType(checker, type);

        // Should expand to the literal values
        expect(result).toBe('"blue" | "green" | "red"');
      });

      it('should expand generic type aliases to their literal values', () => {
        // Create a generic type alias: type AllowedValues<T> = T
        const sourceCode = `
          type AllowedValues<T> = T;
          const value: AllowedValues<"a" | "b" | "c"> = "a";
        `;

        const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.ES2015, true);
        const program = ts.createProgram(['test.ts'], {}, createTestCompilerHost(sourceFile));
        const checker = program.getTypeChecker();

        // Get the type of the 'value' variable
        const variableStatement = sourceFile.statements[1] as ts.VariableStatement;
        const variableDeclaration = variableStatement.declarationList.declarations[0];
        const type = checker.getTypeAtLocation(variableDeclaration);

        const result = resolveType(checker, type);

        // Should expand to the literal values
        expect(result).toBe('"a" | "b" | "c"');
      });

      it('should expand unions of type aliases with more than 20 members', () => {
        // Create a union type with 21 string literal values (3 + 18)
        const sourceCode = `
          type ColorName = "Lavender" | "Mint" | "Rose";
          type ColorShadeName = "100" | "200" | "300" | "400" | "500" | "600";
          type AllowedColors<T> = T;
          const color: ColorName | AllowedColors<\`\${ColorName}-\${ColorShadeName}\`> = "Lavender";
        `;

        const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.ES2015, true);
        const program = ts.createProgram(['test.ts'], {}, createTestCompilerHost(sourceFile));
        const checker = program.getTypeChecker();

        // Get the type of the 'color' variable
        const variableStatement = sourceFile.statements[3] as ts.VariableStatement;
        const variableDeclaration = variableStatement.declarationList.declarations[0];
        const type = checker.getTypeAtLocation(variableDeclaration);

        const result = resolveType(checker, type);

        // Should expand to all 21 literal values (3 base colors + 18 combinations)
        const parts = result.split(' | ');
        expect(parts.length).toBe(21);
        expect(parts).toContain('"Lavender"');
        expect(parts).toContain('"Mint"');
        expect(parts).toContain('"Rose"');
        expect(parts).toContain('"Lavender-100"');
        expect(parts).toContain('"Mint-600"');
        expect(parts).toContain('"Rose-600"');

        // Verify no malformed entries (should not contain type alias names or angle brackets)
        expect(result).not.toContain('ColorName');
        expect(result).not.toContain('AllowedColors');
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
      });

      it('should handle parseDocsType correctly for union types', () => {
        // Test that parseDocsType properly expands union types
        const sourceCode = `
          type Status = "active" | "inactive";
          const status: Status = "active";
        `;

        const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.ES2015, true);
        const program = ts.createProgram(['test.ts'], {}, createTestCompilerHost(sourceFile));
        const checker = program.getTypeChecker();

        // Get the type of the 'status' variable
        const variableStatement = sourceFile.statements[1] as ts.VariableStatement;
        const variableDeclaration = variableStatement.declarationList.declarations[0];
        const type = checker.getTypeAtLocation(variableDeclaration);

        const parts = new Set<string>();
        parseDocsType(checker, type, parts);

        expect(parts.size).toBe(2);
        expect(parts.has('"active"')).toBe(true);
        expect(parts.has('"inactive"')).toBe(true);
      });
    });
  });
});
