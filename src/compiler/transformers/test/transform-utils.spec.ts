import * as ts from 'typescript';

import {
  isMemberPrivate,
  mapJSDocTagInfo,
  retrieveModifierLike,
  retrieveTsDecorators,
  retrieveTsModifiers,
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
});
