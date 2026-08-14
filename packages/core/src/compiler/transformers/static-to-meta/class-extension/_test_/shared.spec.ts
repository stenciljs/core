import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { reanchorInheritedTypeReferences } from '..';
import { findReExport } from '../shared';

describe('reanchorInheritedTypeReferences', () => {
  const CMP_PATH = '/src/components/data-entry/checkbox/checkbox.tsx';
  const BASE_CLASS_PATH = '/src/components/shared/input/base-input.ts';

  const buildProperty = (
    references: d.ComponentCompilerTypeReferences,
  ): d.ComponentCompilerProperty =>
    ({
      name: 'validator',
      complexType: {
        original: 'Validator',
        resolved: 'Validator',
        references,
      },
    }) as d.ComponentCompilerProperty;

  it('re-anchors a relative import reference onto the component directory', () => {
    const property = buildProperty({
      Validator: {
        location: 'import',
        path: './input.types',
        id: 'src/components/shared/input/input.types.ts::Validator',
      },
    });

    reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

    expect(property.complexType.references['Validator']).toEqual({
      location: 'import',
      path: '../../shared/input/input.types',
      id: 'src/components/shared/input/input.types.ts::Validator',
    });
  });

  it('re-anchors a relative import when the extended class is in a subdirectory of the component', () => {
    const property = buildProperty({
      UtilType: {
        location: 'import',
        // relative to the base class in `shared/`, this resolves to /src/components/util-types
        path: '../util-types',
        id: 'src/components/util-types.ts::UtilType',
      },
    });

    reanchorInheritedTypeReferences(
      [property],
      '/src/components/shared/abstract-component.tsx',
      '/src/components/sub-component.tsx',
    );

    expect(property.complexType.references['UtilType']).toEqual({
      location: 'import',
      path: './util-types',
      id: 'src/components/util-types.ts::UtilType',
    });
  });

  it('re-anchors a relative import reference pointing outside the extended class directory', () => {
    const property = buildProperty({
      Validator: {
        location: 'import',
        // resolves to /src/utils/validation.types from the base class's directory
        path: '../../../utils/validation.types',
        id: 'src/utils/validation.types.ts::Validator',
      },
    });

    reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

    expect(property.complexType.references['Validator'].path).toBe(
      '../../../utils/validation.types',
    );
  });

  it('converts a local reference into an import of the extended class module', () => {
    const property = buildProperty({
      InputSize: {
        location: 'local',
        path: BASE_CLASS_PATH,
        id: 'src/components/shared/input/base-input.ts::InputSize',
      },
    });

    reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

    expect(property.complexType.references['InputSize']).toEqual({
      location: 'import',
      path: '../../shared/input/base-input',
      id: 'src/components/shared/input/base-input.ts::InputSize',
    });
  });

  it('prefixes "./" when the re-anchored specifier is not explicitly relative', () => {
    const property = buildProperty({
      Validator: {
        location: 'import',
        path: './input.types',
        id: 'src/components/input.types.ts::Validator',
      },
    });

    // base class in a parent directory of the component
    reanchorInheritedTypeReferences(
      [property],
      '/src/components/base-input.ts',
      '/src/checkbox.tsx',
    );

    expect(property.complexType.references['Validator'].path).toBe('./components/input.types');
  });

  it('leaves package import references untouched', () => {
    const reference: d.ComponentCompilerTypeReference = {
      location: 'import',
      path: '@my-org/types',
      id: 'node_modules::Validator',
    };
    const property = buildProperty({ Validator: { ...reference } });

    reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

    expect(property.complexType.references['Validator']).toEqual(reference);
  });

  it('leaves global references untouched', () => {
    const reference: d.ComponentCompilerTypeReference = {
      location: 'global',
      id: 'global::HTMLElement',
    };
    const property = buildProperty({ HTMLElement: { ...reference } });

    reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

    expect(property.complexType.references['HTMLElement']).toEqual(reference);
  });

  it('does not rewrite references when the extended class lives in the same directory', () => {
    const reference: d.ComponentCompilerTypeReference = {
      location: 'import',
      path: './input.types',
      id: 'src/components/data-entry/checkbox/input.types.ts::Validator',
    };
    const property = buildProperty({ Validator: { ...reference } });

    reanchorInheritedTypeReferences(
      [property],
      '/src/components/data-entry/checkbox/base.ts',
      CMP_PATH,
    );

    expect(property.complexType.references['Validator']).toEqual(reference);
  });

  it('re-anchors an import reference from a node_modules collection, swapping dist/collection for dist/types', () => {
    const property = buildProperty({
      Validator: {
        location: 'import',
        path: './input.types',
        id: 'node_modules::Validator',
      },
    });

    reanchorInheritedTypeReferences(
      [property],
      '/node_modules/@my-org/core/dist/collection/base-input.js',
      CMP_PATH,
    );

    expect(property.complexType.references['Validator']).toEqual({
      location: 'import',
      path: '../../../../node_modules/@my-org/core/dist/types/input.types',
      id: 'node_modules::Validator',
    });
  });

  it('converts a local reference from a node_modules collection into a dist/types import, stripping the .js extension', () => {
    const property = buildProperty({
      InputSize: {
        location: 'local',
        path: '/node_modules/@my-org/core/dist/collection/base-input.js',
        id: 'node_modules::InputSize',
      },
    });

    reanchorInheritedTypeReferences(
      [property],
      '/node_modules/@my-org/core/dist/collection/base-input.js',
      CMP_PATH,
    );

    expect(property.complexType.references['InputSize']).toEqual({
      location: 'import',
      path: '../../../../node_modules/@my-org/core/dist/types/base-input',
      id: 'node_modules::InputSize',
    });
  });

  it('leaves a node_modules import path untouched when it has no dist/collection segment to swap', () => {
    const property = buildProperty({
      Validator: {
        location: 'import',
        path: './input.types',
        id: 'node_modules::Validator',
      },
    });

    reanchorInheritedTypeReferences(
      [property],
      '/node_modules/@my-org/core/dist-custom-elements/base-input.js',
      CMP_PATH,
    );

    expect(property.complexType.references['Validator'].path).toBe(
      '../../../../node_modules/@my-org/core/dist-custom-elements/input.types',
    );
  });

  it('handles members without complex type references', () => {
    const method = { name: 'doSomething' } as d.ComponentCompilerMethod;

    expect(() =>
      reanchorInheritedTypeReferences([method], BASE_CLASS_PATH, CMP_PATH),
    ).not.toThrow();
  });
});

describe('findReExport', () => {
  const parse = (code: string) =>
    ts.createSourceFile('barrel.ts', code, ts.ScriptTarget.ESNext, true);

  it('finds a plain re-export', () => {
    const sf = parse(`export { BaseInput } from './base-input';`);

    expect(findReExport(sf, 'BaseInput')).toEqual({
      moduleSpecifier: './base-input',
      localName: 'BaseInput',
    });
  });

  it('finds an aliased re-export, resolving to the original (local) name', () => {
    const sf = parse(`export { BaseInput as Input } from './base-input';`);

    expect(findReExport(sf, 'Input')).toEqual({
      moduleSpecifier: './base-input',
      localName: 'BaseInput',
    });
  });

  it('picks the matching element out of a multi-specifier export clause', () => {
    const sf = parse(`export { Foo, BaseInput, Bar as Baz } from './base-input';`);

    expect(findReExport(sf, 'BaseInput')).toEqual({
      moduleSpecifier: './base-input',
      localName: 'BaseInput',
    });
  });

  it('finds the matching statement among several re-export statements', () => {
    const sf = parse(`
      export { Foo } from './foo';
      export { BaseInput } from './base-input';
    `);

    expect(findReExport(sf, 'BaseInput')).toEqual({
      moduleSpecifier: './base-input',
      localName: 'BaseInput',
    });
  });

  it('returns undefined when the name is not re-exported at all', () => {
    const sf = parse(`export { Foo } from './foo';`);

    expect(findReExport(sf, 'BaseInput')).toBeUndefined();
  });

  it('does not treat a local declaration of the same name as a re-export', () => {
    const sf = parse(`export class BaseInput {}`);

    expect(findReExport(sf, 'BaseInput')).toBeUndefined();
  });

  it('does not follow a wildcard re-export (`export * from`)', () => {
    const sf = parse(`export * from './base-input';`);

    expect(findReExport(sf, 'BaseInput')).toBeUndefined();
  });

  it('ignores a bare `export {}` with no module specifier', () => {
    const sf = parse(`
      class BaseInput {}
      export { BaseInput };
    `);

    expect(findReExport(sf, 'BaseInput')).toBeUndefined();
  });
});
