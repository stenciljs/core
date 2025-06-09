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
      });
    });
  });
});
