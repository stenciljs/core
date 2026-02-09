import { mockModule } from '@stencil/core/testing';

import type * as d from '@stencil/core';
import { getBuildFeatures, updateComponentBuildConditionals } from '../../app-core/app-data';
import { stubComponentCompilerMeta } from '../../types/tests/ComponentCompilerMeta.stub';
import { transpileModule } from './transpile';

describe('functional component dependencies', () => {
  describe('parseCallExpression with functional components', () => {
    it('should detect svg tag in direct JSX usage', () => {
      const t = transpileModule(`
        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return <svg viewBox="0 0 24 24"><path d="M0 0"/></svg>
          }
        }
      `);

      expect(t.cmp.htmlTagNames).toContain('svg');
      expect(t.cmp.htmlTagNames).toContain('path');
    });

    it('should set hasVdomFunctional when using a functional component', () => {
      const t = transpileModule(`
        const SvgIcon = () => <svg viewBox="0 0 24 24"/>;

        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return <SvgIcon/>
          }
        }
      `);

      expect(t.cmp.hasVdomFunctional).toBe(true);
    });

    it('should detect svg in same-file functional component', () => {
      // When a functional component is in the same file, the svg tag should be detected
      // because parseCallExpression is called for all h() calls in the module
      const t = transpileModule(`
        const SvgIcon = () => <svg viewBox="0 0 24 24"/>;

        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return <SvgIcon/>
          }
        }
      `);

      // The module should have svg in its htmlTagNames because the functional component
      // is defined in the same file
      expect(t.moduleFile.htmlTagNames).toContain('svg');
    });

    it('should track functionalComponentDeps on the module', () => {
      const t = transpileModule(`
        const MyIcon = () => <div/>;

        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return <MyIcon/>
          }
        }
      `);

      // functionalComponentDeps should be initialized as an array
      expect(Array.isArray(t.moduleFile.functionalComponentDeps)).toBe(true);
    });
  });

  describe('updateComponentBuildConditionals with functionalComponentDeps', () => {
    it('should merge htmlTagNames from functionalComponentDeps', () => {
      // Create a mock module map with two modules:
      // 1. A functional component module that has 'svg' in its htmlTagNames
      // 2. A component module that references the functional component
      const moduleMap: d.ModuleMap = new Map();

      // Module for the functional component (e.g., icons/help.tsx)
      const iconModule = mockModule({
        sourceFilePath: '/src/icons/help.tsx',
        htmlTagNames: ['svg', 'path'],
        localImports: [],
        functionalComponentDeps: [],
      });
      moduleMap.set('/src/icons/help.tsx', iconModule);

      // Module for the component that uses the icon
      const componentModule = mockModule({
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: ['div'],
        localImports: [],
        // This simulates typeChecker resolving the functional component import
        functionalComponentDeps: ['/src/icons/help.tsx'],
      });
      moduleMap.set('/src/components/my-icon.tsx', componentModule);

      // Create a component that references the functional component
      const cmp = stubComponentCompilerMeta({
        tagName: 'my-icon',
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: ['div'],
      });

      // Run updateComponentBuildConditionals
      updateComponentBuildConditionals(moduleMap, [cmp]);

      // The component should now have svg and path in its htmlTagNames
      expect(cmp.htmlTagNames).toContain('svg');
      expect(cmp.htmlTagNames).toContain('path');
      expect(cmp.htmlTagNames).toContain('div');
    });

    it('should follow nested functionalComponentDeps', () => {
      const moduleMap: d.ModuleMap = new Map();

      // Deep nested icon module
      const deepIconModule = mockModule({
        sourceFilePath: '/src/icons/svg/help.tsx',
        htmlTagNames: ['svg'],
        localImports: [],
        functionalComponentDeps: [],
      });
      moduleMap.set('/src/icons/svg/help.tsx', deepIconModule);

      // Barrel file that re-exports
      const barrelModule = mockModule({
        sourceFilePath: '/src/icons/index.tsx',
        htmlTagNames: [],
        localImports: ['/src/icons/svg/help.tsx'],
        functionalComponentDeps: [],
      });
      moduleMap.set('/src/icons/index.tsx', barrelModule);

      // Component module
      const componentModule = mockModule({
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: [],
        localImports: ['/src/icons/index.tsx'],
        functionalComponentDeps: [],
      });
      moduleMap.set('/src/components/my-icon.tsx', componentModule);

      const cmp = stubComponentCompilerMeta({
        tagName: 'my-icon',
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: [],
      });

      updateComponentBuildConditionals(moduleMap, [cmp]);

      // Should propagate through localImports chain
      expect(cmp.htmlTagNames).toContain('svg');
    });

    it('should follow functionalComponentDeps even without localImports', () => {
      // This tests the case where typeChecker resolves a functional component
      // that wasn't tracked in localImports (e.g., dynamic property access)
      const moduleMap: d.ModuleMap = new Map();

      // Icon module (not in localImports, only in functionalComponentDeps)
      const iconModule = mockModule({
        sourceFilePath: '/src/icons/help.tsx',
        htmlTagNames: ['svg'],
        localImports: [],
        functionalComponentDeps: [],
      });
      moduleMap.set('/src/icons/help.tsx', iconModule);

      // Component module that uses the icon via dynamic access
      // localImports might not include the icon file, but functionalComponentDeps does
      const componentModule = mockModule({
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: [],
        localImports: [], // Empty - simulates case where barrel file doesn't re-export statically
        functionalComponentDeps: ['/src/icons/help.tsx'], // But typeChecker found it
      });
      moduleMap.set('/src/components/my-icon.tsx', componentModule);

      const cmp = stubComponentCompilerMeta({
        tagName: 'my-icon',
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: [],
      });

      updateComponentBuildConditionals(moduleMap, [cmp]);

      // Should still get svg because functionalComponentDeps is followed
      expect(cmp.htmlTagNames).toContain('svg');
    });

    it('should merge all vdom build conditionals from functionalComponentDeps', () => {
      // Verify that ALL build conditionals are propagated, not just htmlTagNames
      const moduleMap: d.ModuleMap = new Map();

      // Functional component module with various vdom features
      const iconModule = mockModule({
        sourceFilePath: '/src/icons/fancy-icon.tsx',
        htmlTagNames: ['svg', 'path'],
        htmlAttrNames: ['viewBox', 'xmlns', 'd'],
        potentialCmpRefs: [],
        hasVdomAttribute: true,
        hasVdomClass: true,
        hasVdomStyle: true,
        hasVdomKey: true,
        hasVdomRef: true,
        hasVdomListener: true,
        localImports: [],
        functionalComponentDeps: [],
      });
      moduleMap.set('/src/icons/fancy-icon.tsx', iconModule);

      // Component module
      const componentModule = mockModule({
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: [],
        htmlAttrNames: [],
        hasVdomAttribute: false,
        hasVdomClass: false,
        hasVdomStyle: false,
        hasVdomKey: false,
        hasVdomRef: false,
        hasVdomListener: false,
        localImports: [],
        functionalComponentDeps: ['/src/icons/fancy-icon.tsx'],
      });
      moduleMap.set('/src/components/my-icon.tsx', componentModule);

      const cmp = stubComponentCompilerMeta({
        tagName: 'my-icon',
        sourceFilePath: '/src/components/my-icon.tsx',
        htmlTagNames: [],
        htmlAttrNames: [],
        hasVdomAttribute: false,
        hasVdomClass: false,
        hasVdomStyle: false,
        hasVdomKey: false,
        hasVdomRef: false,
        hasVdomListener: false,
      });

      updateComponentBuildConditionals(moduleMap, [cmp]);

      // All vdom conditionals should be propagated
      expect(cmp.hasVdomAttribute).toBe(true);
      expect(cmp.hasVdomClass).toBe(true);
      expect(cmp.hasVdomStyle).toBe(true);
      expect(cmp.hasVdomKey).toBe(true);
      expect(cmp.hasVdomRef).toBe(true);
      expect(cmp.hasVdomListener).toBe(true);

      // htmlTagNames and htmlAttrNames should be merged
      expect(cmp.htmlTagNames).toContain('svg');
      expect(cmp.htmlTagNames).toContain('path');
      expect(cmp.htmlAttrNames).toContain('viewBox');
      expect(cmp.htmlAttrNames).toContain('xmlns');
      expect(cmp.htmlAttrNames).toContain('d');
    });
  });

  describe('getBuildFeatures with functional component svg', () => {
    it('should set svg build flag when svg is in htmlTagNames from functional component deps', () => {
      const cmp = stubComponentCompilerMeta({
        tagName: 'my-icon',
        htmlTagNames: ['svg', 'div'],
      });

      const buildFeatures = getBuildFeatures([cmp]);

      expect(buildFeatures.svg).toBe(true);
    });

    it('should not set svg build flag when no svg in htmlTagNames', () => {
      const cmp = stubComponentCompilerMeta({
        tagName: 'my-button',
        htmlTagNames: ['div', 'button'],
      });

      const buildFeatures = getBuildFeatures([cmp]);

      expect(buildFeatures.svg).toBe(false);
    });
  });
});
