import type * as d from '../../../declarations';
import * as UtilHelpers from '../../../utils/helpers';
import * as Util from '../../../utils/util';
import { generateEventTypes } from '../generate-event-types';
import * as StencilTypes from '../stencil-types';
import { stubComponentCompilerEvent } from './ComponentCompilerEvent.stub';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';
import { stubTypesImportData } from './TypesImportData.stub';

describe('generate-event-types', () => {
  describe('generateEventTypes', () => {
    let updateTypeIdentifierNamesSpy: jest.SpyInstance<
      ReturnType<typeof StencilTypes.updateTypeIdentifierNames>,
      Parameters<typeof StencilTypes.updateTypeIdentifierNames>
    >;
    let getTextDocsSpy: jest.SpyInstance<ReturnType<typeof Util.getTextDocs>, Parameters<typeof Util.getTextDocs>>;
    let toTitleCaseSpy: jest.SpyInstance<
      ReturnType<typeof UtilHelpers.toTitleCase>,
      Parameters<typeof UtilHelpers.toTitleCase>
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

      getTextDocsSpy = jest.spyOn(Util, 'getTextDocs');
      getTextDocsSpy.mockReturnValue('');

      toTitleCaseSpy = jest.spyOn(UtilHelpers, 'toTitleCase');
      toTitleCaseSpy.mockImplementation((_name: string) => 'MyEvent');
    });

    afterEach(() => {
      updateTypeIdentifierNamesSpy.mockRestore();
      getTextDocsSpy.mockRestore();
      toTitleCaseSpy.mockRestore();
    });

    it('returns an empty array when no events are provided', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta();
      const cmpClassName = 'MyComponent';

      expect(generateEventTypes(componentMeta, stubImportTypes, cmpClassName)).toEqual([]);
    });

    it('prefixes the event name with "on"', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });
      const cmpClassName = 'MyComponent';

      const actualTypeInfo = generateEventTypes(componentMeta, stubImportTypes, cmpClassName);

      expect(actualTypeInfo).toHaveLength(1);
      expect(actualTypeInfo[0].name).toBe('onMyEvent');
    });

    it('derives a generic CustomEvent from the original type', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });
      const cmpClassName = 'MyComponent';

      const actualTypeInfo = generateEventTypes(componentMeta, stubImportTypes, cmpClassName);

      expect(actualTypeInfo).toHaveLength(1);
      expect(actualTypeInfo[0].type).toBe('(event: MyComponentCustomEvent<UserImplementedEventType>) => void');
    });

    it('uses an updated type name to avoid naming collisions', () => {
      const updatedTypeName = 'SomeTypeReturned';
      updateTypeIdentifierNamesSpy.mockReturnValue(updatedTypeName);

      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });
      const cmpClassName = 'MyComponent';

      const actualTypeInfo = generateEventTypes(componentMeta, stubImportTypes, cmpClassName);

      expect(actualTypeInfo).toHaveLength(1);
      expect(actualTypeInfo[0].type).toBe(`(event: MyComponentCustomEvent<${updatedTypeName}>) => void`);
    });

    it('derives CustomEvent type when there is no original typing field', () => {
      const stubImportTypes = stubTypesImportData();
      const componentEvent = stubComponentCompilerEvent({
        complexType: {
          original: '',
          resolved: '',
          references: {},
        },
      });
      const componentMeta = stubComponentCompilerMeta({
        events: [componentEvent],
      });
      const cmpClassName = 'MyComponent';

      const actualTypeInfo = generateEventTypes(componentMeta, stubImportTypes, cmpClassName);

      expect(actualTypeInfo).toHaveLength(1);
      expect(actualTypeInfo[0].type).toBe('CustomEvent');
    });

    it('returns the correct type info for a single event', () => {
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });
      const stubImportTypes = stubTypesImportData();

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'onMyEvent',
          optional: false,
          required: false,
          type: '(event: MyComponentCustomEvent<UserImplementedEventType>) => void',
        },
      ];
      const cmpClassName = 'MyComponent';

      const actualTypeInfo = generateEventTypes(componentMeta, stubImportTypes, cmpClassName);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });

    it('returns the correct type info for multiple events', () => {
      toTitleCaseSpy.mockReturnValueOnce('MyEvent');
      toTitleCaseSpy.mockReturnValueOnce('AnotherEvent');

      const componentEvent1 = stubComponentCompilerEvent();
      const componentEvent2 = stubComponentCompilerEvent({
        internal: true,
        name: 'anotherEvent',
        method: 'anotherEvent',
        complexType: {
          original: '',
          resolved: '',
          references: {},
        },
      });
      const componentMeta = stubComponentCompilerMeta({
        events: [componentEvent1, componentEvent2],
      });
      const stubImportTypes = stubTypesImportData();
      const cmpClassName = 'MyComponent';

      const expectedTypeInfo: d.TypeInfo = [
        {
          jsdoc: '',
          internal: false,
          name: 'onMyEvent',
          optional: false,
          required: false,
          type: '(event: MyComponentCustomEvent<UserImplementedEventType>) => void',
        },
        {
          jsdoc: '',
          internal: true,
          name: 'onAnotherEvent',
          optional: false,
          required: false,
          type: 'CustomEvent',
        },
      ];

      const actualTypeInfo = generateEventTypes(componentMeta, stubImportTypes, cmpClassName);

      expect(actualTypeInfo).toEqual(expectedTypeInfo);
    });
  });
});
