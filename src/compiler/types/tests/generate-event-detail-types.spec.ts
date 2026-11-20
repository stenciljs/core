import type * as d from '../../../declarations';
import { generateEventDetailTypes } from '../generate-event-detail-types';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';

describe('generate-event-detail-types', () => {
  describe('generateEventDetailTypes', () => {
    it('returns the correct type module data for a component', () => {
      const tagName = 'event-detail-test-tag';
      const tagNameAsPascal = 'EventDetailTestTag';

      const expectedTypeInfo = `export interface ${tagNameAsPascal}CustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTML${tagNameAsPascal}Element;
}`;
      const componentMeta = stubComponentCompilerMeta({
        tagName,
      });

      const actualEventDetailTypes = generateEventDetailTypes(componentMeta);

      expect(actualEventDetailTypes).toEqual<d.TypesModule>({
        component: expectedTypeInfo,
        element: expectedTypeInfo,
        htmlElementName: `HTML${tagNameAsPascal}Element`,
        isDep: false,
        jsx: expectedTypeInfo,
        tagName,
        tagNameAsPascal,
        explicitAttributes: null,
        explicitProperties: null,
        requiredProps: null,
      });
    });

    it('types the event target for a component class with type parameters', () => {
      const componentMeta = stubComponentCompilerMeta({
        tagName: 'my-table',
        typeParameters: [
          { name: 'T', references: {} },
          { name: 'K', constraint: 'keyof T', references: {} },
        ],
      });

      const actualEventDetailTypes = generateEventDetailTypes(componentMeta);

      expect(actualEventDetailTypes.component)
        .toBe(`export interface MyTableCustomEvent<T, E extends HTMLMyTableElement<any, any> = HTMLMyTableElement> extends CustomEvent<T> {
    detail: T;
    target: E;
}`);
    });
  });
});
