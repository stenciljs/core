import type * as d from '../../../declarations';
import { generatePropTypes } from '../generate-prop-types';
import * as StencilTypes from '../stencil-types';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';
import { stubComponentCompilerProperty } from './ComponentCompilerProperty.stub';
import { stubComponentCompilerVirtualProperty } from './ComponentCompilerVirtualProperty.stub';
import { stubTypesImportData } from './TypesImportData.stub';

describe('generate-prop-types', () => {
  describe('generatePropTypes', () => {
    let updateTypeIdentifierNamesSpy: jest.SpyInstance<
      ReturnType<typeof StencilTypes.updateTypeIdentifierNames>,
      Parameters<typeof StencilTypes.updateTypeIdentifierNames>
    >;

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
    });

    afterEach(() => {
      updateTypeIdentifierNamesSpy.mockRestore();
    });

    it('returns an empty array when no props are provided', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta();

      expect(generatePropTypes(componentMeta, stubImportTypes)).toEqual([]);
    });

    it('returns the correct type information for a single property', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [stubComponentCompilerProperty()],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('uses an updated type name to avoid naming collisions', () => {
      const updatedTypeName = 'SomeTypeReturned';
      updateTypeIdentifierNamesSpy.mockReturnValue(updatedTypeName);

      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [stubComponentCompilerProperty()],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: updatedTypeName,
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('returns the correct type information for a single virtual property', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        virtualProperties: [stubComponentCompilerVirtualProperty()],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: 'this is a doc string',
          internal: false,
          name: 'virtualPropName',
          optional: true,
          required: false,
          type: 'number',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('returns the correct type information for concrete and virtual properties', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [stubComponentCompilerProperty()],
        virtualProperties: [stubComponentCompilerVirtualProperty()],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
        {
          jsdoc: 'this is a doc string',
          internal: false,
          name: 'virtualPropName',
          optional: true,
          required: false,
          type: 'number',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('appends `@readonly` to jsdoc when the property has a getter and no setter', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [
          stubComponentCompilerProperty({
            getter: true,
            setter: false,
          }),
        ],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '@readonly',
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('does not include `@readonly` to jsdoc when the property has a getter and a setter', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [
          stubComponentCompilerProperty({
            getter: true,
            setter: true,
          }),
        ],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('appends `@default` to jsdoc when the property has a default value', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [
          stubComponentCompilerProperty({
            defaultValue: "'hello'",
          }),
        ],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: "@default 'hello'",
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('does not duplicate `@default` in jsdoc when it is already present', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [
          stubComponentCompilerProperty({
            defaultValue: "'hello'",
            docs: {
              text: '',
              tags: [{ name: 'default', text: "'existing default'" }],
            },
          }),
        ],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: "@default 'existing default'",
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('escapes "*/" in default values within jsdoc', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        properties: [
          stubComponentCompilerProperty({
            defaultValue: "'*/*'",
          }),
        ],
      });

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: "@default '*\\/*'", // Editor will evaluate this as @default '*\/*'
          internal: false,
          name: 'propName',
          optional: false,
          required: false,
          type: 'UserCustomPropType',
        },
      ];

      const actualTypeInfo = generatePropTypes(componentMeta, stubImportTypes);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });
  });
});
