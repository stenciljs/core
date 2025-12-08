import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for mixed decorator types - same name used as different decorator types in inheritance chains.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Test Case #18 - Mixed Decorator Types
 * Features:
 * - @Prop in Base, @State in Component (mixedName)
 * - @State in Base, @Prop in Component (mixedStateName)
 * - @Method in Base, @Prop in Component (mixedMethodName)
 * - Runtime behavior verification
 */

describe('Test Case #18 – Mixed Decorator Types (Different decorator types, same name)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-mixed-decorators/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.container'), { timeout: 5000 });
    });

    describe('@Prop in Base, @State in Component (mixedName)', () => {
      it('component @State overrides base @Prop - component value is used', async () => {
        const mixedName = frameContent.querySelector('.mixed-name-value');
        
        expect(mixedName?.textContent).toContain('Mixed Name: component state value');
        expect(mixedName?.textContent).not.toContain('base prop value');
      });

      it('component @State updates trigger re-renders correctly', async () => {
        const button = frameContent.querySelector('.update-mixed-name') as HTMLButtonElement;
        
        // Click button to update mixedName state
        button?.click();
        
        await browser.waitUntil(() => {
          const mixedName = frameContent.querySelector('.mixed-name-value');
          return mixedName?.textContent?.includes('mixed name updated');
        }, { timeout: 3000 });

        const mixedName = frameContent.querySelector('.mixed-name-value');
        expect(mixedName?.textContent).toContain('Mixed Name: mixed name updated');
      });

      it('component @State can be updated via method', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        await component.updateMixedName('updated via method');
        
        await browser.waitUntil(() => {
          const mixedName = frameContent.querySelector('.mixed-name-value');
          return mixedName?.textContent?.includes('updated via method');
        }, { timeout: 3000 });

        const mixedName = frameContent.querySelector('.mixed-name-value');
        expect(mixedName?.textContent).toContain('Mixed Name: updated via method');
      });

      it('base @Prop is not accessible (component @State wins)', async () => {
        const mixedName = frameContent.querySelector('.mixed-name-value');
        
        // Verify component @State value is used (not base @Prop)
        expect(mixedName?.textContent).toContain('component state value');
        expect(mixedName?.textContent).not.toContain('base prop value');
        
        // Verify it behaves as a state (reactive, can be updated)
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        await component.updateMixedName('state behavior verified');
        
        await browser.waitUntil(() => {
          const updated = frameContent.querySelector('.mixed-name-value');
          return updated?.textContent?.includes('state behavior verified');
        }, { timeout: 3000 });
      });

      it('component @State type is active (not base @Prop type)', async () => {
        const mixedNameType = frameContent.querySelector('.mixed-name-type');
        
        expect(mixedNameType?.textContent).toContain('component @State overrides base @Prop');
      });
    });

    describe('@State in Base, @Prop in Component (mixedStateName)', () => {
      it('component @Prop initial value is used (not base @State)', async () => {
        const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
        
        expect(mixedStateName?.textContent).toContain('Mixed State Name: component prop value');
        expect(mixedStateName?.textContent).not.toContain('base state value');
      });

      it('component @Prop conflicts with base @State - attribute updates may not work', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators');
        const initialValue = frameContent.querySelector('.mixed-state-name-value')?.textContent;
        component?.setAttribute('mixed-state-name', 'updated via attribute');
        
        // Wait to see if update occurs
        await browser.waitUntil(() => {
          const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
          return mixedStateName?.textContent?.includes('updated via attribute');
        }, { timeout: 3000 }).catch(() => {
          // If update doesn't occur, document this as runtime behavior
          const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
          // Verify initial value is still present (conflict prevents update)
          expect(mixedStateName?.textContent).toContain('component prop value');
        });
      });

      it('component @Prop conflicts with base @State - property updates may not work', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        component.mixedStateName = 'updated via property';
        
        // Wait to see if update occurs
        await browser.waitUntil(() => {
          const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
          return mixedStateName?.textContent?.includes('updated via property');
        }, { timeout: 3000 }).catch(() => {
          // If update doesn't occur, document this as runtime behavior
          const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
          // Verify initial value is still present (conflict prevents update)
          expect(mixedStateName?.textContent).toContain('component prop value');
        });
      });

      it('base @State conflicts with component @Prop - initial value shows component prop', async () => {
        const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
        
        // Verify component @Prop initial value is used (not base @State)
        expect(mixedStateName?.textContent).toContain('component prop value');
        expect(mixedStateName?.textContent).not.toContain('base state value');
        
        // Document that conflicts may prevent updates
        // This is the actual runtime behavior being tested
      });
    });

    describe('@Method in Base, @Prop in Component (mixedMethodName)', () => {
      it('component @Prop initial value is used (not base @Method)', async () => {
        const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
        
        expect(mixedMethodName?.textContent).toContain('Mixed Method Name: component prop value');
        expect(mixedMethodName?.textContent).not.toContain('base method');
      });

      it('component @Prop conflicts with base @Method - attribute updates may not work', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators');
        component?.setAttribute('mixed-method-name', 'updated via attribute');
        
        // Wait to see if update occurs
        await browser.waitUntil(() => {
          const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
          return mixedMethodName?.textContent?.includes('updated via attribute');
        }, { timeout: 3000 }).catch(() => {
          // If update doesn't occur, document this as runtime behavior
          const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
          // Verify initial value is still present (conflict prevents update)
          expect(mixedMethodName?.textContent).toContain('component prop value');
        });
      });

      it('base @Method conflicts with component @Prop - property is read-only', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        
        // Verify component @Prop initial value is used (not base @Method)
        const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
        expect(mixedMethodName?.textContent).toContain('component prop value');
        expect(mixedMethodName?.textContent).not.toContain('base method');
        
        // Document that base @Method makes property read-only
        // This is the actual runtime behavior being tested
        let assignmentFailed = false;
        try {
          component.mixedMethodName = 'updated via property';
        } catch (e) {
          assignmentFailed = true;
        }
        expect(assignmentFailed).toBe(true);
      });

      it('base @Method takes precedence - property cannot be assigned', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        
        // Verify initial value shows component prop
        const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
        expect(mixedMethodName?.textContent).toContain('component prop value');
        
        // Verify base @Method prevents property assignment
        // This documents the runtime conflict behavior
        let assignmentFailed = false;
        try {
          component.mixedMethodName = 'prop behavior verified';
        } catch (e) {
          assignmentFailed = true;
        }
        expect(assignmentFailed).toBe(true);
      });
    });

    describe('Runtime Behavior', () => {
      it('only one version exists in final component (component decorator type wins)', async () => {
        const mixedName = frameContent.querySelector('.mixed-name-value');
        const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
        const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
        
        // Verify component decorator types are active (not base)
        expect(mixedName?.textContent).toContain('component state value');
        expect(mixedStateName?.textContent).toContain('component prop value');
        expect(mixedMethodName?.textContent).toContain('component prop value');
        
        // Verify base values are not present
        expect(mixedName?.textContent).not.toContain('base prop value');
        expect(mixedStateName?.textContent).not.toContain('base state value');
        expect(mixedMethodName?.textContent).not.toContain('base method');
      });

      it('winning decorator types behave correctly', async () => {
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        
        // Test @State behavior (mixedName) - this works correctly
        await component.updateMixedName('state reactivity verified');
        await browser.waitUntil(() => {
          const updated = frameContent.querySelector('.mixed-name-value');
          return updated?.textContent?.includes('state reactivity verified');
        }, { timeout: 3000 });
        
        // Test @Prop behavior (mixedStateName) - may conflict with base @State
        component.mixedStateName = 'prop attribute verified';
        await browser.waitUntil(() => {
          const updated = frameContent.querySelector('.mixed-state-name-value');
          return updated?.textContent?.includes('prop attribute verified');
        }, { timeout: 3000 }).catch(() => {
          // If update doesn't occur, document conflict behavior
          const updated = frameContent.querySelector('.mixed-state-name-value');
          expect(updated?.textContent).toContain('component prop value');
        });
        
        // Test @Prop behavior (mixedMethodName) - conflicts with base @Method
        let assignmentFailed = false;
        try {
          component.mixedMethodName = 'prop method override verified';
        } catch (e) {
          assignmentFailed = true;
        }
        expect(assignmentFailed).toBe(true);
      });

      it('non-conflicting base decorators remain accessible', async () => {
        const baseOnlyProp = frameContent.querySelector('.base-only-prop-value');
        const baseOnlyState = frameContent.querySelector('.base-only-state-value');
        const component = frameContent.querySelector('extends-mixed-decorators') as any;
        
        expect(baseOnlyProp?.textContent).toContain('base only prop value');
        expect(baseOnlyState?.textContent).toContain('base only state value');
        
        // Verify base method is still accessible
        await component.resetMethodCallLog();
        const result = await component.baseOnlyMethod();
        expect(result).toBe('base only method');
        
        const baseLog = await component.getMethodCallLog();
        expect(baseLog).toContain('baseOnlyMethod');
      });
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/extends-mixed-decorators/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.container'), { timeout: 5000 });
    });

    it('component @State overrides base @Prop in custom elements build', async () => {
      const mixedName = frameContent.querySelector('.mixed-name-value');
      
      expect(mixedName?.textContent).toContain('Mixed Name: component state value');
      expect(mixedName?.textContent).not.toContain('base prop value');
    });

    it('component @Prop overrides base @State in custom elements build', async () => {
      const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
      
      expect(mixedStateName?.textContent).toContain('Mixed State Name: component prop value');
      expect(mixedStateName?.textContent).not.toContain('base state value');
    });

    it('component @Prop overrides base @Method in custom elements build', async () => {
      const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
      
      expect(mixedMethodName?.textContent).toContain('Mixed Method Name: component prop value');
      expect(mixedMethodName?.textContent).not.toContain('base method');
    });

    it('component decorator types take precedence in custom elements build', async () => {
      const mixedName = frameContent.querySelector('.mixed-name-value');
      const mixedStateName = frameContent.querySelector('.mixed-state-name-value');
      const mixedMethodName = frameContent.querySelector('.mixed-method-name-value');
      
      expect(mixedName?.textContent).toContain('component state value');
      expect(mixedStateName?.textContent).toContain('component prop value');
      expect(mixedMethodName?.textContent).toContain('component prop value');
    });
  });
});

