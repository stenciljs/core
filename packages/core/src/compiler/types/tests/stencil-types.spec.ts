import * as d from '@stencil/core/declarations';
import path from 'path';

jest.mock('@utils', () => {
  const originalUtils = jest.requireActual('@utils');
  return {
    __esModule: true,
    ...originalUtils,
    resolve: (...pathSegments: string[]) => pathSegments.pop(),
  };
});

import { updateTypeIdentifierNames } from '../stencil-types';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';
import { stubComponentCompilerTypeReference } from './ComponentCompilerTypeReference.stub';
import { stubTypesImportData } from './TypesImportData.stub';

describe('stencil-types', () => {
  describe('updateTypeMemberNames', () => {
    let dirnameSpy: jest.SpyInstance<ReturnType<typeof path.dirname>, Parameters<typeof path.dirname>>;

    beforeEach(() => {
      dirnameSpy = jest.spyOn(path, 'dirname');
      dirnameSpy.mockImplementation((path: string) => path);
    });

    afterEach(() => {
      dirnameSpy.mockRestore();
    });

    describe('no type transformations', () => {
      it('returns the provided type when no type references exist', () => {
        const expectedTypeName = 'CustomType';

        const actualTypeName = updateTypeIdentifierNames(
          {},
          {},
          stubComponentCompilerMeta().sourceFilePath,
          expectedTypeName,
        );

        expect(actualTypeName).toBe(expectedTypeName);
      });

      it('returns the provided type when no type reference matches are found in the import data', () => {
        const typeReferences: d.ComponentCompilerTypeReferences = {
          AnotherType: stubComponentCompilerTypeReference({ location: 'import', path: 'some/stubbed/path' }),
        };
        const expectedTypeName = 'CustomType';

        const actualTypeName = updateTypeIdentifierNames(
          typeReferences,
          {},
          stubComponentCompilerMeta().sourceFilePath,
          expectedTypeName,
        );

        expect(actualTypeName).toBe(expectedTypeName);
      });

      it('returns the provided type for imports without a path', () => {
        const expectedTypeName = 'CustomType';
        const typeReferences: d.ComponentCompilerTypeReferences = {
          // pretend that the expected type name is a globally accessible type, and therefore has no path
          [expectedTypeName]: stubComponentCompilerTypeReference({ location: 'global' }),
        };

        const actualTypeName = updateTypeIdentifierNames(
          typeReferences,
          {},
          stubComponentCompilerMeta().sourceFilePath,
          expectedTypeName,
        );

        expect(actualTypeName).toBe(expectedTypeName);
      });

      it('returns the provided type for imports without the resolved file', () => {
        const expectedTypeName = 'CustomType';
        const typeReferences: d.ComponentCompilerTypeReferences = {
          // we're testing the `path` value doesn't exist on the type import data.
          // in practice this should never happen, but let's ensure that we cover this case explicitly in tests
          [expectedTypeName]: stubComponentCompilerTypeReference({
            location: 'import',
            path: 'some/mock/unknown/path',
          }),
        };

        const actualTypeName = updateTypeIdentifierNames(
          typeReferences,
          {},
          stubComponentCompilerMeta().sourceFilePath,
          expectedTypeName,
        );

        expect(actualTypeName).toBe(expectedTypeName);
      });

      it("does not change a simple type when there's no import name to alias", () => {
        const initialType = 'InitialType';
        const basePath = '~/some/stubbed/path';
        const typePath = `${basePath}/my-types`;

        const componentCompilerMeta = stubComponentCompilerMeta({
          sourceFilePath: `${basePath}/my-component.tsx`,
        });
        const typeReferences: d.ComponentCompilerTypeReferences = {
          [initialType]: stubComponentCompilerTypeReference({ location: 'import', path: typePath }),
        };
        const typeImports = stubTypesImportData({
          [typePath]: [
            {
              localName: 'SomeOtherType',
              originalName: 'SomeOtherType',
            },
          ],
        });

        const actualTypeName = updateTypeIdentifierNames(
          typeReferences,
          typeImports,
          componentCompilerMeta.sourceFilePath,
          initialType,
        );

        expect(actualTypeName).toBe(initialType);
      });
    });

    describe('path resolution', () => {
      it('replaces a simple type for a relative path beginning with "."', () => {
        const initialType = 'InitialType';
        const expectedType = 'NonCollisionType';
        const basePath = './some/stubbed/path';

        expectTypeTransformForPath(basePath, initialType, expectedType);
      });

      it('replaces a simple type for a relative path beginning with ".."', () => {
        const initialType = 'InitialType';
        const expectedType = 'NonCollisionType';
        const basePath = '../some/stubbed/path';

        expectTypeTransformForPath(basePath, initialType, expectedType);
      });

      it('replaces a simple type for an absolute path', () => {
        const initialType = 'InitialType';
        const expectedType = 'NonCollisionType';
        const basePath = '~/some/stubbed/path';

        expectTypeTransformForPath(basePath, initialType, expectedType);
      });

      /**
       * Test helper for performing boilerplate setup to verify some initial type T is transformed to a new type T'.
       * This helper asserts that the generated type matches T'.
       *
       * This helper is meant to be used to test that transformation occurs based on the format/type of `basePath`
       * provided (e.g. relative vs absolute).
       *
       * @param basePath the path to use when running the type resolution
       * @param initialType the original type found in a class member
       * @param expectedType the type that is expected to be generated
       */
      const expectTypeTransformForPath = (basePath: string, initialType: string, expectedType: string): void => {
        const typePath = `${basePath}/my-types`;

        const componentCompilerMeta = stubComponentCompilerMeta({
          sourceFilePath: `${basePath}/my-component.tsx`,
        });

        const typeReferences: d.ComponentCompilerTypeReferences = {
          [initialType]: stubComponentCompilerTypeReference({ location: 'import', path: typePath }),
        };
        const typeImports = stubTypesImportData({
          [typePath]: [
            {
              localName: initialType,
              originalName: initialType,
              importName: expectedType,
            },
          ],
        });

        const actualTypeName = updateTypeIdentifierNames(
          typeReferences,
          typeImports,
          componentCompilerMeta.sourceFilePath,
          initialType,
        );

        expect(actualTypeName).toBe(expectedType);
      };
    });

    it('replaces method signature types', () => {
      const initialType = '(name: SomeType) => Promise<void>';
      const expectedType = '(name: SomeOtherType) => Promise<void>';
      const typeMemberNames = [
        {
          localName: 'SomeType',
          originalName: 'SomeType',
          importName: 'SomeOtherType',
        },
      ];

      expectTypeIsTransformed(initialType, expectedType, typeMemberNames);
    });

    it('replaces duplicate types', () => {
      const initialType = '(myVal: Ar) => Promise<Ar>';
      const expectedType = '(myVal: Ar1) => Promise<Ar1>';
      const typeMemberNames = [
        {
          localName: 'Ar',
          originalName: 'Ar',
          importName: 'Ar1',
        },
      ];

      expectTypeIsTransformed(initialType, expectedType, typeMemberNames);
    });

    it('replaces types that are substrings safely', () => {
      const initialType = '(ar: Ar) => Promise<Array<Ar>>';
      const expectedType = '(ar: Ar1) => Promise<Array<Ar1>>';
      const typeMemberNames = [
        {
          localName: 'Ar',
          originalName: 'Ar',
          importName: 'Ar1',
        },
      ];

      expectTypeIsTransformed(initialType, expectedType, typeMemberNames);
    });

    it('replaces union types', () => {
      const initialType = '(myVal: SomeType | AnotherType) => Promise<SomeType | AnotherType>';
      const expectedType = '(myVal: SomeType1 | AnotherType1) => Promise<SomeType1 | AnotherType1>';
      const typeMemberNames = [
        {
          localName: 'SomeType',
          originalName: 'SomeType',
          importName: 'SomeType1',
        },
        {
          localName: 'AnotherType',
          originalName: 'AnotherType',
          importName: 'AnotherType1',
        },
      ];

      expectTypeIsTransformed(initialType, expectedType, typeMemberNames);
    });

    it("doesn't replace string literals in types", () => {
      const initialType = '(myVal: ReadonlyArray<"SomeType">) => Promise<SomeType>';
      const expectedType = '(myVal: ReadonlyArray<"SomeType">) => Promise<SomeType1>';
      const typeMemberNames = [
        {
          localName: 'SomeType',
          originalName: 'SomeType',
          importName: 'SomeType1',
        },
      ];

      expectTypeIsTransformed(initialType, expectedType, typeMemberNames);
    });

    // TODO(STENCIL-419): Re-enable this test
    it.skip("doesn't replace resolved types", () => {
      /**
       * Edge case, consider the following scenario:
       * ```ts
       * type SomeType = 'OneThing'
       * const SomeType = 'Something' as const;
       * type FnType = (myVal: ReadonlyArray<`${typeof SomeType}`>) => Promise<SomeType>;
       * ```
       *
       * - `myVal` will resolve to `readonly 'Something'[]`
       * - the return type will resolve to Promise<'OneThing'>;
       */
      const initialType = '(myVal: ReadonlyArray<`${typeof SomeType}`>) => Promise<SomeType>';
      const expectedType = '(myVal: ReadonlyArray<`${typeof SomeType}`>) => Promise<SomeType1>';
      const typeMemberNames = [
        {
          localName: 'SomeType',
          originalName: 'SomeType',
          importName: 'SomeType1',
        },
      ];

      expectTypeIsTransformed(initialType, expectedType, typeMemberNames);
    });

    /**
     * Test helper for performing boilerplate setup to verify some initial type T is transformed to a new type T'. This
     * helper asserts that the generated type matches T'.
     * @param initialType the original type found in a class member
     * @param expectedType the type that is expected to be generated
     * @param typeMemberNames a series of aliases that map a locally used type T to some other type T2
     */
    const expectTypeIsTransformed = (
      initialType: string,
      expectedType: string,
      typeMemberNames: d.TypesMemberNameData[],
    ) => {
      const basePath = '~/some/stubbed/path';

      const componentCompilerMeta = stubComponentCompilerMeta({
        sourceFilePath: `${basePath}/my-component.tsx`,
      });

      const typeReferences: d.ComponentCompilerTypeReferences = {
        [initialType]: stubComponentCompilerTypeReference({ location: 'import', path: `${basePath}/my-types` }),
      };
      const typeImports = stubTypesImportData({
        [`${basePath}/my-types`]: typeMemberNames,
      });

      const actualTypeName = updateTypeIdentifierNames(
        typeReferences,
        typeImports,
        componentCompilerMeta.sourceFilePath,
        initialType,
      );

      expect(actualTypeName).toBe(expectedType);
    };
  });
});
