import type * as d from '../../../declarations';
import * as Util from '../../../utils/util';
import { generateMethodTypes } from '../generate-method-types';
import * as StencilTypes from '../stencil-types';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';
import { stubComponentCompilerMethod } from './ComponentCompilerMethod.stub';
import { stubTypesImportData } from './TypesImportData.stub';

describe('generate-method-types', () => {
  describe('generateMethodTypes', () => {
    let updateTypeIdentifierNamesSpy: jest.SpyInstance<
      ReturnType<typeof StencilTypes.updateTypeIdentifierNames>,
      Parameters<typeof StencilTypes.updateTypeIdentifierNames>
    >;
    let getTextDocsSpy: jest.SpyInstance<ReturnType<typeof Util.getTextDocs>, Parameters<typeof Util.getTextDocs>>;

    beforeEach(() => {
      updateTypeIdentifierNamesSpy = jest.spyOn(StencilTypes, 'updateTypeIdentifierNames');
      updateTypeIdentifierNamesSpy.mockImplementation(
        (
          _typeReferences: d.ComponentCompilerTypeReferences,
          _typeImportData: d.TypesImportData,
          _sourceFilePath: string,
          initialType: string,
        ) => initialType,
      );

      getTextDocsSpy = jest.spyOn(Util, 'getTextDocs');
      getTextDocsSpy.mockReturnValue('');
    });

    afterEach(() => {
      updateTypeIdentifierNamesSpy.mockRestore();
      getTextDocsSpy.mockRestore();
    });

    it('returns an empty array when no methods are provided', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta();

      expect(generateMethodTypes(componentMeta, stubImportTypes)).toEqual([]);
    });

    it('returns the correct type info for a single method', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMethod = stubComponentCompilerMethod();
      const componentMeta = stubComponentCompilerMeta({
        methods: [componentMethod],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'myMethod',
          optional: false,
          required: false,
          type: '(name: Foo) => Promise<void>',
        },
      ];

      const actualTypeInfo = generateMethodTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('uses an updated type name to avoid naming collisions', () => {
      const updatedTypeName = '(name: SomeTypeReturned) => Promise<void>';
      updateTypeIdentifierNamesSpy.mockReturnValue(updatedTypeName);

      const stubImportTypes = stubTypesImportData();
      const componentMethod = stubComponentCompilerMethod();
      const componentMeta = stubComponentCompilerMeta({
        methods: [componentMethod],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'myMethod',
          optional: false,
          required: false,
          type: updatedTypeName,
        },
      ];

      const actualTypeInfo = generateMethodTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('returns the correct type info for multiple methods', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMethod1 = stubComponentCompilerMethod();
      const componentMethod2 = stubComponentCompilerMethod({
        name: 'myOtherMethod',
        internal: true,
        complexType: {
          parameters: [{ name: 'age', type: 'Bar', docs: '' }],
          references: { Bar: { location: 'local', id: 'placeholder_id', path: './other-resources' } },
          return: 'Promise<boolean>',
          signature: '(age: Bar) => Promise<boolean>',
        },
        docs: undefined,
      });
      const componentMeta = stubComponentCompilerMeta({
        methods: [componentMethod1, componentMethod2],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'myMethod',
          optional: false,
          required: false,
          type: '(name: Foo) => Promise<void>',
        },
        {
          jsdoc: '',
          internal: true,
          name: 'myOtherMethod',
          optional: false,
          required: false,
          type: '(age: Bar) => Promise<boolean>',
        },
      ];

      const actualTypeInfo = generateMethodTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });
  });
});
