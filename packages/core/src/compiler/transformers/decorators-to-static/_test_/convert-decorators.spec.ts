import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { mockValidatedConfig } from '../../../../testing';
import { convertDecoratorsToStatic } from '../convert-decorators';

// Runs the transform over `code` and returns the printed output - mirrors the throwaway
// single-file programs the class-extension mixin-resolution helpers use
// (convertDiskSourceFileDecorators / convertInMemorySourceDecorators).
const runTransform = (code: string, includeClassExpressions?: boolean): string => {
  const config = mockValidatedConfig({ tsCompilerOptions: {} });
  const compilerOptions: ts.CompilerOptions = {
    experimentalDecorators: true,
    noLib: true,
    noResolve: true,
    isolatedModules: false,
    target: ts.ScriptTarget.ESNext,
  };
  const fileName = 'input.tsx';
  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...rest) =>
    name === fileName
      ? ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
      : originalGetSourceFile(name, ...rest);
  const program = ts.createProgram([fileName], compilerOptions, host);
  const typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName)!;
  const result = ts.transform(sourceFile, [
    convertDecoratorsToStatic(config, [], typeChecker, program, includeClassExpressions),
  ]);
  return ts.createPrinter().printFile(result.transformed[0]);
};

describe('convertDecoratorsToStatic', () => {
  it('converts decorators on a named class declaration (default behavior, unaffected by the flag)', () => {
    const printed = runTransform(`
      import { Prop } from '@stencil/core';
      export class Foo {
        @Prop() bar: string;
      }
    `);
    expect(printed).toContain('static get properties()');
    expect(printed).not.toContain('@Prop');
  });

  it('leaves a class expression untouched by default (includeClassExpressions omitted)', () => {
    const printed = runTransform(`
      import { Prop } from '@stencil/core';
      export const FocusMixin = (Base) => class extends Base {
        @Prop() isFocused: boolean;
      };
    `);
    expect(printed).not.toContain('static get properties()');
    expect(printed).toContain('@Prop');
  });

  it('converts decorators on an anonymous class expression when includeClassExpressions is true', () => {
    const printed = runTransform(
      `
      import { Prop } from '@stencil/core';
      export const FocusMixin = (Base) => class extends Base {
        @Prop() isFocused: boolean;
      };
    `,
      true,
    );
    expect(printed).toContain('static get properties()');
    expect(printed).not.toContain('@Prop');
  });

  it('does not crash on a stray @Component on an anonymous class expression', () => {
    // @Component() on an anonymous class expression is nonsensical (it could never be discovered
    // as a real component regardless), but shouldn't crash the transform - componentDecoratorToStatic
    // reads `cmpNode.name.text` unconditionally, which would throw on an anonymous class, so this
    // path is gated to skip it rather than call in.
    expect(() =>
      runTransform(
        `
        import { Component, Prop } from '@stencil/core';
        export const FocusMixin = (Base) =>
          @Component({ tag: 'my-cmp' })
          class extends Base {
            @Prop() isFocused: boolean;
          };
      `,
        true,
      ),
    ).not.toThrow();
  });
});
