import type * as d from '../../../declarations';
import { generateEventListenerTypes } from '../generate-event-listener-types';
import * as StencilTypes from '../stencil-types';
import { stubComponentCompilerEvent } from './ComponentCompilerEvent.stub';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';
import { stubTypesImportData } from './TypesImportData.stub';

describe('generate-event-listener-types', () => {
  describe('generateEventListenerTypes', () => {
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

    it('returns empty arrays when no events are provided', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta();

      const expectedEventListenerTypes: ReturnType<typeof generateEventListenerTypes> = {
        htmlElementEventMap: [],
        htmlElementEventListenerProperties: [],
      };

      expect(generateEventListenerTypes(componentMeta, stubImportTypes)).toEqual(expectedEventListenerTypes);
    });

    it('returns the correct event map type that contains each user implemented event type', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });

      const expectedHtmlElementEventMap = [
        '    interface HTMLStubCmpElementEventMap {',
        '        "myEvent": UserImplementedEventType;',
        '    }',
      ];

      const { htmlElementEventMap } = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(htmlElementEventMap).toEqual(expectedHtmlElementEventMap);
    });

    it('returns the correct event map type where keys are wrapped with quotes', () => {
      const stubImportTypes = stubTypesImportData();
      const expectedEventMapKey = 'my-key-with-dashes';
      const componentEvent = stubComponentCompilerEvent({
        internal: true,
        name: expectedEventMapKey,
        method: expectedEventMapKey,
        complexType: {
          original: 'UserImplementedEventType',
          resolved: '',
          references: {},
        },
      });
      const componentMeta = stubComponentCompilerMeta({
        events: [componentEvent],
      });

      const expectedHtmlElementEventMap = [
        '    interface HTMLStubCmpElementEventMap {',
        `        "${expectedEventMapKey}": UserImplementedEventType;`,
        '    }',
      ];

      const { htmlElementEventMap } = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(htmlElementEventMap).toEqual(expectedHtmlElementEventMap);
    });

    it('derives event listener properties from event map', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });

      const expectedHtmlElementEventListenerProperties = [
        '        addEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | AddEventListenerOptions): void;',
        '        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
        '        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
        '        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;',
        '        removeEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | EventListenerOptions): void;',
        '        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
        '        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
        '        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;',
      ];

      const { htmlElementEventListenerProperties } = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(htmlElementEventListenerProperties).toEqual(expectedHtmlElementEventListenerProperties);
    });

    it('uses an updated type name to avoid naming collisions', () => {
      const stubImportTypes = stubTypesImportData();
      const updatedTypeName = 'SomeTypeReturned';
      updateTypeIdentifierNamesSpy.mockReturnValue(updatedTypeName);

      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });

      const expectedHtmlElementEventMap = [
        '    interface HTMLStubCmpElementEventMap {',
        `        "myEvent": ${updatedTypeName};`,
        '    }',
      ];

      const { htmlElementEventMap } = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(htmlElementEventMap).toEqual(expectedHtmlElementEventMap);
    });

    it('returns the correct event listener types for a single event', () => {
      const stubImportTypes = stubTypesImportData();
      const componentMeta = stubComponentCompilerMeta({
        events: [stubComponentCompilerEvent()],
      });

      const expectedEventListenerTypes = {
        htmlElementEventMap: [
          '    interface HTMLStubCmpElementEventMap {',
          '        "myEvent": UserImplementedEventType;',
          '    }',
        ],
        htmlElementEventListenerProperties: [
          '        addEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;',
          '        removeEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;',
        ],
      };

      const actualEventListenerTypes = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(actualEventListenerTypes).toEqual(expectedEventListenerTypes);
    });

    it('returns the correct type info for multiple events', () => {
      const stubImportTypes = stubTypesImportData();
      const componentEvent1 = stubComponentCompilerEvent(stubComponentCompilerEvent());
      const componentEvent2 = stubComponentCompilerEvent({
        internal: true,
        name: 'anotherEvent',
        method: 'anotherEvent',
        complexType: {
          original: 'AnotherUserImplementedEventType',
          resolved: '',
          references: {},
        },
      });
      const componentMeta = stubComponentCompilerMeta({
        events: [componentEvent1, componentEvent2],
      });

      const expectedEventListenerTypes = {
        htmlElementEventMap: [
          '    interface HTMLStubCmpElementEventMap {',
          '        "myEvent": UserImplementedEventType;',
          '        "anotherEvent": AnotherUserImplementedEventType;',
          '    }',
        ],
        htmlElementEventListenerProperties: [
          '        addEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;',
          '        removeEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;',
        ],
      };

      const actualEventListenerTypes = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(actualEventListenerTypes).toEqual(expectedEventListenerTypes);
    });

    it('skips any events with no original typing field', () => {
      const stubImportTypes = stubTypesImportData();
      const componentEvent1 = stubComponentCompilerEvent();
      const componentEvent2 = stubComponentCompilerEvent({
        complexType: {
          original: '',
          resolved: '',
          references: {},
        },
      });
      const componentMeta = stubComponentCompilerMeta({
        events: [componentEvent1, componentEvent2],
      });

      const expectedEventListenerTypes = {
        htmlElementEventMap: [
          '    interface HTMLStubCmpElementEventMap {',
          '        "myEvent": UserImplementedEventType;',
          '    }',
        ],
        htmlElementEventListenerProperties: [
          '        addEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;',
          '        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;',
          '        removeEventListener<K extends keyof HTMLStubCmpElementEventMap>(type: K, listener: (this: HTMLStubCmpElement, ev: StubCmpCustomEvent<HTMLStubCmpElementEventMap[K]>) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;',
          '        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;',
        ],
      };

      const actualEventListenerTypes = generateEventListenerTypes(componentMeta, stubImportTypes);

      expect(actualEventListenerTypes).toEqual(expectedEventListenerTypes);
    });

    it('returns empty arrays when all events have no original typing field', () => {
      const stubImportTypes = stubTypesImportData();
      const componentEvent1 = stubComponentCompilerEvent({
        complexType: {
          original: '',
          resolved: '',
          references: {},
        },
      });
      const componentEvent2 = stubComponentCompilerEvent({
        complexType: {
          original: '',
          resolved: '',
          references: {},
        },
      });
      const componentMeta = stubComponentCompilerMeta({
        events: [componentEvent1, componentEvent2],
      });

      const expectedEventListenerTypes: ReturnType<typeof generateEventListenerTypes> = {
        htmlElementEventMap: [],
        htmlElementEventListenerProperties: [],
      };

      expect(generateEventListenerTypes(componentMeta, stubImportTypes)).toEqual(expectedEventListenerTypes);
    });
  });
});
