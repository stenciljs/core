import * as ts from 'typescript';

import {
  isMemberPrivate,
  mapJSDocTagInfo,
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
});
