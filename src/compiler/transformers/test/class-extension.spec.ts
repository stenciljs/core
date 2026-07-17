import type * as d from '../../../declarations';
import { reanchorInheritedTypeReferences } from '../static-to-meta/class-extension';

describe('class-extension', () => {
  describe('reanchorInheritedTypeReferences', () => {
    const CMP_PATH = '/src/components/data-entry/checkbox/checkbox.tsx';
    const BASE_CLASS_PATH = '/src/components/shared/input/base-input.ts';

    const buildProperty = (references: d.ComponentCompilerTypeReferences): d.ComponentCompilerProperty =>
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

      expect(property.complexType.references['Validator'].path).toBe('../../../utils/validation.types');
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
      reanchorInheritedTypeReferences([property], '/src/components/base-input.ts', '/src/checkbox.tsx');

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

      reanchorInheritedTypeReferences([property], '/src/components/data-entry/checkbox/base.ts', CMP_PATH);

      expect(property.complexType.references['Validator']).toEqual(reference);
    });

    it('does not rewrite references when the extended class comes from node_modules', () => {
      const reference: d.ComponentCompilerTypeReference = {
        location: 'import',
        path: './input.types',
        id: 'node_modules::Validator',
      };
      const property = buildProperty({ Validator: { ...reference } });

      reanchorInheritedTypeReferences([property], '/node_modules/@my-org/core/dist/collection/base-input.js', CMP_PATH);

      expect(property.complexType.references['Validator']).toEqual(reference);
    });

    it('handles members without complex type references', () => {
      const method = { name: 'doSomething' } as d.ComponentCompilerMethod;

      expect(() => reanchorInheritedTypeReferences([method], BASE_CLASS_PATH, CMP_PATH)).not.toThrow();
    });
  });
});
