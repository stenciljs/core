import type * as d from '../../../../declarations';
import { stubComponentCompilerMeta } from '../../../types/tests/ComponentCompilerMeta.stub';
import { sortBundleComponents } from '../generate-lazy-module';

describe('generate-lazy-module', () => {
  describe('sortBundleComponents', () => {
    const PARENT_CMP_TAG = 'cmp-a';
    const CHILD_CMP_TAG = 'cmp-b';
    const GRANDCHILD_CMP_TAG = 'cmp-c';
    let parentCmp: d.ComponentCompilerMeta;
    let childCmp: d.ComponentCompilerMeta;
    let grandChildCmp: d.ComponentCompilerMeta;

    beforeEach(() => {
      /**
       * Create a series of components with the following hierarchy:
       *  <cmp-a>
       *    <cmp-b>
       *      <cmp-c></cmp-c>
       *    </cmp-b>
       *  </cmp-a>
       *
       * Note that in the dependency arrays in each of these components, we intentionally sort non-empty arrays to
       * mirror what Stencil's dependency calculations would generate.
       */
      parentCmp = stubComponentCompilerMeta({
        componentClassName: 'ParentCmp',
        dependents: [],
        directDependents: [],
        dependencies: [CHILD_CMP_TAG, GRANDCHILD_CMP_TAG].sort(),
        directDependencies: [CHILD_CMP_TAG],
        tagName: PARENT_CMP_TAG,
      });
      childCmp = stubComponentCompilerMeta({
        componentClassName: 'ChildCmp',
        dependents: [PARENT_CMP_TAG].sort(),
        directDependents: [PARENT_CMP_TAG].sort(),
        dependencies: [GRANDCHILD_CMP_TAG].sort(),
        directDependencies: [GRANDCHILD_CMP_TAG].sort(),
        tagName: CHILD_CMP_TAG,
      });
      grandChildCmp = stubComponentCompilerMeta({
        componentClassName: 'GrandChildCmp',
        dependents: [CHILD_CMP_TAG, PARENT_CMP_TAG].sort(),
        directDependents: [CHILD_CMP_TAG].sort(),
        dependencies: [],
        directDependencies: [],
        tagName: GRANDCHILD_CMP_TAG,
      });
    });

    describe('directDependents', () => {
      it("returns '1' when the first component lists the second as a direct dependent", () => {
        expect(sortBundleComponents(childCmp, parentCmp)).toEqual(1);
      });

      it("returns '-1' when the second component lists the first as a direct dependent", () => {
        expect(sortBundleComponents(parentCmp, childCmp)).toEqual(-1);
      });

      it('orders components by their directDependents', () => {
        expect([childCmp, parentCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);
        expect([parentCmp, childCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);

        expect([childCmp, grandChildCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);
        expect([grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);

        expect([parentCmp, grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([
          parentCmp,
          childCmp,
          grandChildCmp,
        ]);
      });
    });

    describe('directDependencies', () => {
      beforeEach(() => {
        [parentCmp, childCmp, grandChildCmp].forEach((cmp) => {
          // clear `directDependents` from each component, as it's the first criteria used to sort components (and will
          // be used if present, which is not what we want for these tests)
          cmp.directDependents = [];
          // clear the other "dependency" field(s), to ensure that the sorting only takes `directDependents` and
          // `tagName` into consideration
          cmp.dependents = [];
          cmp.dependencies = [];
        });
      });

      it("returns '1' when the first component lists the second as a direct dependency", () => {
        expect(sortBundleComponents(parentCmp, childCmp)).toEqual(1);
      });

      it("returns '-1' when the second component lists the first as a direct dependency", () => {
        expect(sortBundleComponents(childCmp, parentCmp)).toEqual(-1);
      });

      it('orders components by their directDependencies', () => {
        expect([childCmp, parentCmp].sort(sortBundleComponents)).toEqual([childCmp, parentCmp]);
        expect([parentCmp, childCmp].sort(sortBundleComponents)).toEqual([childCmp, parentCmp]);

        expect([childCmp, grandChildCmp].sort(sortBundleComponents)).toEqual([grandChildCmp, childCmp]);
        expect([grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([grandChildCmp, childCmp]);

        expect([childCmp, grandChildCmp, parentCmp].sort(sortBundleComponents)).toEqual([
          parentCmp,
          grandChildCmp,
          childCmp,
        ]);
      });
    });

    describe('dependents', () => {
      beforeEach(() => {
        [parentCmp, childCmp, grandChildCmp].forEach((cmp) => {
          // clear `directDependents` and `directDependencies` fields from each component, as they're checked first when
          // we sort components (and will be used if present, which is not what we want for these tests)
          cmp.directDependents = [];
          cmp.directDependencies = [];
          // clear the other "dependency" field(s), to ensure that the sorting only takes `directDependents` and
          // `tagName` into consideration
          cmp.dependencies = [];
        });
      });

      it("returns '1' when the first component lists the second as a dependent", () => {
        expect(sortBundleComponents(grandChildCmp, childCmp)).toEqual(1);
      });

      it("returns '-1' when the second component lists the first as a dependent", () => {
        expect(sortBundleComponents(childCmp, grandChildCmp)).toEqual(-1);
      });

      it('orders components by their dependent', () => {
        expect([childCmp, grandChildCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);
        expect([grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);

        // `parentCmp` doesn't have any tags in its `dependents` field, but `childCmp` has `parentCmp`'s tag name in its
        // `dependents` list
        expect([childCmp, parentCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);
        expect([parentCmp, childCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);

        expect([parentCmp, grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([
          parentCmp,
          childCmp,
          grandChildCmp,
        ]);
      });

      describe('no overlapping dependents', () => {
        beforeEach(() => {
          parentCmp.dependents = ['unique-cmp-1', 'unique-cmp-2'];
          childCmp.dependents = ['unique-cmp-3'];
        });

        it("returns '-1' when the first component has less dependents than the second", () => {
          expect(sortBundleComponents(childCmp, parentCmp)).toEqual(-1);
        });

        it("returns '1' when the first component has more dependents than the second", () => {
          expect(sortBundleComponents(parentCmp, childCmp)).toEqual(1);
        });
      });
    });

    describe('dependencies', () => {
      beforeEach(() => {
        [parentCmp, childCmp, grandChildCmp].forEach((cmp) => {
          // clear `directDependents`, `directDependencies`, and `dependents` fields from each component, as they're
          // checked first when we sort components (and will be used if present, which is not what we want for these
          // tests). this ensures that the sorting only takes `dependencies` and `tagName` into account
          cmp.directDependents = [];
          cmp.directDependencies = [];
          cmp.dependents = [];
        });
      });

      it("returns '1' when the first component lists the second as a dependency", () => {
        expect(sortBundleComponents(parentCmp, childCmp)).toEqual(1);
      });

      it("returns '-1' when the second component lists the first as a dependency", () => {
        expect(sortBundleComponents(childCmp, parentCmp)).toEqual(-1);
      });

      it('orders components by their dependencies', () => {
        expect([parentCmp, childCmp].sort(sortBundleComponents)).toEqual([childCmp, parentCmp]);
        expect([childCmp, parentCmp].sort(sortBundleComponents)).toEqual([childCmp, parentCmp]);

        // `grandChildCmp` doesn't have any tags in its `dependencies` field, but `childCmp` has `grandChildCmp`'s tag
        // name in its `dependencies` list
        expect([childCmp, grandChildCmp].sort(sortBundleComponents)).toEqual([grandChildCmp, childCmp]);
        expect([grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([grandChildCmp, childCmp]);

        expect([parentCmp, grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([
          grandChildCmp,
          childCmp,
          parentCmp,
        ]);
      });

      describe('no overlapping dependencies', () => {
        beforeEach(() => {
          parentCmp.dependencies = ['unique-cmp-1', 'unique-cmp-2'];
          childCmp.dependencies = ['unique-cmp-3'];
          grandChildCmp.dependencies = [];
        });

        it("returns '-1' when the first component has more dependencies than the second", () => {
          expect(sortBundleComponents(parentCmp, childCmp)).toEqual(-1);
        });

        it("returns '1' when the first component has less dependencies than the second", () => {
          expect(sortBundleComponents(childCmp, parentCmp)).toEqual(1);
        });

        it('orders components by their dependencies', () => {
          expect([parentCmp, childCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);
          expect([childCmp, parentCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);

          expect([childCmp, grandChildCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);
          expect([grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);

          expect([parentCmp, grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([
            parentCmp,
            childCmp,
            grandChildCmp,
          ]);
        });
      });
    });

    describe('tag names', () => {
      beforeEach(() => {
        [parentCmp, childCmp, grandChildCmp].forEach((cmp) => {
          // clear all dependency fields from each component, so that we may only take the `tagName` into account
          cmp.directDependents = [];
          cmp.directDependencies = [];
          cmp.dependents = [];
          cmp.dependencies = [];
        });
      });

      it("returns '-1' when the first component's tag name comes first alphabetically", () => {
        expect(sortBundleComponents(parentCmp, childCmp)).toEqual(-1);
      });

      it("returns '1' when the first component's tag name comes second alphabetically", () => {
        expect(sortBundleComponents(childCmp, parentCmp)).toEqual(1);
      });

      it("returns '0' when the tag names are the same", () => {
        expect(sortBundleComponents(parentCmp, parentCmp)).toEqual(0);
      });

      it('orders components by their tag names', () => {
        expect([parentCmp, childCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);
        expect([childCmp, parentCmp].sort(sortBundleComponents)).toEqual([parentCmp, childCmp]);

        expect([childCmp, grandChildCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);
        expect([grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([childCmp, grandChildCmp]);

        expect([parentCmp, grandChildCmp, childCmp].sort(sortBundleComponents)).toEqual([
          parentCmp,
          childCmp,
          grandChildCmp,
        ]);
      });
    });
  });
});
