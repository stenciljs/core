import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for @Watch decorator inheritance through extends.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Test Case #11 - Watch Decorator Inheritance
 * Features:
 * - @Watch decorator inheritance from base class
 * - Multiple @Watch decorators for same property at different inheritance levels
 * - Watch execution order (base class first, component second)
 * - Reactive property chains (watch handlers triggering other property changes)
 * - Watch handler override behavior (when base and component both watch same property)
 */

describe('Test Case #11 – Watch Decorator Inheritance (@Watch decorators)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-watch/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.watch-info'), { timeout: 5000 });
      
      // Reset state before each test
      const component = frameContent.querySelector<any>('extends-watch');
      await component.resetWatchLogs();
    });

    it('inherits base class @Watch decorator for baseProp', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-prop') as HTMLButtonElement;
      const baseWatchCountEl = frameContent.querySelector('.base-watch-count');
      
      // Get initial count from DOM
      const initialText = baseWatchCountEl?.textContent || '';
      const initialMatch = initialText.match(/Base Watch Calls: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      // Trigger property change
      button?.click();
      
      // Wait for watch handler to be called and DOM to update
      await browser.waitUntil(async () => {
        const updatedText = baseWatchCountEl?.textContent || '';
        const updatedMatch = updatedText.match(/Base Watch Calls: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      // Verify watch handler was called
      const finalText = baseWatchCountEl?.textContent || '';
      const finalMatch = finalText.match(/Base Watch Calls: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      // Verify watch log contains entry
      const watchLog = frameContent.querySelector('#watch-log-list');
      expect(watchLog?.textContent).toContain('basePropChanged');
    });

    it('inherits base class @Watch decorator for baseCount', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-count') as HTMLButtonElement;
      const baseWatchCountEl = frameContent.querySelector('.base-watch-count');
      
      const initialText = baseWatchCountEl?.textContent || '';
      const initialMatch = initialText.match(/Base Watch Calls: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = baseWatchCountEl?.textContent || '';
        const updatedMatch = updatedText.match(/Base Watch Calls: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = baseWatchCountEl?.textContent || '';
      const finalMatch = finalText.match(/Base Watch Calls: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const watchLog = frameContent.querySelector('#watch-log-list');
      expect(watchLog?.textContent).toContain('baseCountChanged');
    });

    it('inherits base class @Watch decorator for baseState', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-state') as HTMLButtonElement;
      const baseWatchCountEl = frameContent.querySelector('.base-watch-count');
      
      const initialText = baseWatchCountEl?.textContent || '';
      const initialMatch = initialText.match(/Base Watch Calls: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = baseWatchCountEl?.textContent || '';
        const updatedMatch = updatedText.match(/Base Watch Calls: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = baseWatchCountEl?.textContent || '';
      const finalMatch = finalText.match(/Base Watch Calls: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const watchLog = frameContent.querySelector('#watch-log-list');
      expect(watchLog?.textContent).toContain('baseStateChanged');
    });

    it('handles child class @Watch decorator for childProp', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-child-prop') as HTMLButtonElement;
      const childWatchCountEl = frameContent.querySelector('.child-watch-count');
      
      const initialText = childWatchCountEl?.textContent || '';
      const initialMatch = initialText.match(/Child Watch Calls: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = childWatchCountEl?.textContent || '';
        const updatedMatch = updatedText.match(/Child Watch Calls: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = childWatchCountEl?.textContent || '';
      const finalMatch = finalText.match(/Child Watch Calls: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const watchLog = frameContent.querySelector('#watch-log-list');
      expect(watchLog?.textContent).toContain('childPropChanged');
    });

    it('executes watch handlers in correct order: base first, then child', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-prop') as HTMLButtonElement;
      
      // Reset logs to start fresh
      await component.resetWatchLogs();
      
      // Trigger property change that both base and child watch
      button?.click();
      
      // Wait for watch handlers to execute
      await browser.pause(500);
      
      // Get watch log
      const watchLog = frameContent.querySelector('#watch-log-list');
      const logContent = watchLog?.textContent || '';
      
      // Find positions of base and child handlers
      const basePropIndex = logContent.indexOf('basePropChanged');
      const childBasePropIndex = logContent.indexOf('childBasePropChanged');
      
      // Base handler should execute before child handler
      expect(basePropIndex).toBeGreaterThan(-1);
      expect(childBasePropIndex).toBeGreaterThan(-1);
      expect(basePropIndex).toBeLessThan(childBasePropIndex);
    });

    it('child override watch handler takes precedence over base', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-override-prop') as HTMLButtonElement;
      const watchLog = frameContent.querySelector('#watch-log-list');
      
      // Reset logs
      await component.resetWatchLogs();
      
      // Get initial log content
      const initialLogContent = watchLog?.textContent || '';
      
      button?.click();
      
      // Wait for watch processing and DOM update
      await browser.waitUntil(async () => {
        const updatedLogContent = watchLog?.textContent || '';
        return updatedLogContent.length > initialLogContent.length;
      }, { timeout: 3000 });
      
      // Verify child handler was called (override behavior)
      const finalLogContent = watchLog?.textContent || '';
      expect(finalLogContent).toContain('overridePropChanged:child');
      
      // Verify base handler was NOT called (override takes precedence)
      const baseOverrideMatches = (finalLogContent.match(/overridePropChanged:base/g) || []).length;
      const initialBaseOverrideMatches = (initialLogContent.match(/overridePropChanged:base/g) || []).length;
      expect(baseOverrideMatches).toBe(initialBaseOverrideMatches);
    });

    it('reactive property chains work: baseProp change triggers baseState change', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-prop') as HTMLButtonElement;
      const baseStateEl = frameContent.querySelector('.base-state-value');
      
      // Get initial state value
      const initialText = baseStateEl?.textContent || '';
      
      button?.click();
      
      // Wait for reactive chain to update baseState
      await browser.waitUntil(async () => {
        const updatedText = baseStateEl?.textContent || '';
        return updatedText !== initialText && updatedText.includes('state updated by baseProp');
      }, { timeout: 3000 });
      
      // Verify baseState was updated by watch handler
      const finalText = baseStateEl?.textContent || '';
      expect(finalText).toContain('state updated by baseProp');
    });

    it('reactive property chains work: baseCount change triggers baseChainCount change', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-count') as HTMLButtonElement;
      const baseChainCountEl = frameContent.querySelector('.base-chain-count');
      
      button?.click();
      
      // Wait for reactive chain to update baseChainCount
      await browser.waitUntil(async () => {
        const chainCountText = baseChainCountEl?.textContent || '';
        const match = chainCountText.match(/Base Chain Count: (\d+)/);
        const count = match ? parseInt(match[1], 10) : 0;
        return count === 10; // baseCount (5) * 2 = 10
      }, { timeout: 3000 });
      
      const finalText = baseChainCountEl?.textContent || '';
      expect(finalText).toContain('Base Chain Count: 10');
    });

    it('reactive property chains work: baseCounter change triggers baseChainTriggered', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-counter') as HTMLButtonElement;
      const baseChainTriggeredEl = frameContent.querySelector('.base-chain-triggered');
      
      // Reset first
      await component.resetWatchLogs();
      
      button?.click();
      
      // Wait for reactive chain to update baseChainTriggered
      await browser.waitUntil(async () => {
        const chainText = baseChainTriggeredEl?.textContent || '';
        return chainText.includes('Base Chain Triggered: true');
      }, { timeout: 3000 });
      
      const finalText = baseChainTriggeredEl?.textContent || '';
      expect(finalText).toContain('Base Chain Triggered: true');
    });

    it('reactive property chains work: childProp change triggers childState change', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-child-prop') as HTMLButtonElement;
      const childStateEl = frameContent.querySelector('.child-state-value');
      
      const initialText = childStateEl?.textContent || '';
      
      button?.click();
      
      // Wait for reactive chain to update childState
      await browser.waitUntil(async () => {
        const updatedText = childStateEl?.textContent || '';
        return updatedText !== initialText && updatedText.includes('state updated by childProp');
      }, { timeout: 3000 });
      
      const finalText = childStateEl?.textContent || '';
      expect(finalText).toContain('state updated by childProp');
    });

    it('reactive property chains work: childCounter change triggers childChainTriggered', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-child-counter') as HTMLButtonElement;
      const childChainTriggeredEl = frameContent.querySelector('.child-chain-triggered');
      
      // Reset first
      await component.resetWatchLogs();
      
      button?.click();
      
      // Wait for reactive chain to update childChainTriggered
      await browser.waitUntil(async () => {
        const chainText = childChainTriggeredEl?.textContent || '';
        return chainText.includes('Child Chain Triggered: true');
      }, { timeout: 3000 });
      
      const finalText = childChainTriggeredEl?.textContent || '';
      expect(finalText).toContain('Child Chain Triggered: true');
    });

    it('tracks watch calls in combined watch log', async () => {
      const totalWatchCountEl = frameContent.querySelector('.total-watch-count');
      const watchLog = frameContent.querySelector('#watch-log-list');
      
      // Trigger multiple property changes
      const basePropBtn = frameContent.querySelector('.update-base-prop') as HTMLButtonElement;
      const childPropBtn = frameContent.querySelector('.update-child-prop') as HTMLButtonElement;
      const baseCountBtn = frameContent.querySelector('.update-base-count') as HTMLButtonElement;
      
      basePropBtn?.click();
      await browser.pause(200);
      childPropBtn?.click();
      await browser.pause(200);
      baseCountBtn?.click();
      
      // Wait for all watch handlers to process - wait for baseCountChanged to appear in log
      await browser.waitUntil(async () => {
        const logContent = watchLog?.textContent || '';
        return logContent.includes('basePropChanged') && 
               logContent.includes('childPropChanged') && 
               logContent.includes('baseCountChanged');
      }, { timeout: 3000 });
      
      const finalLogContent = watchLog?.textContent || '';
      
      expect(finalLogContent).toContain('basePropChanged');
      expect(finalLogContent).toContain('childPropChanged');
      expect(finalLogContent).toContain('baseCountChanged');
    });

    it('increment operations trigger watch handlers', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.increment-base-count') as HTMLButtonElement;
      const baseWatchCountEl = frameContent.querySelector('.base-watch-count');
      const baseCountEl = frameContent.querySelector('.base-count-value');
      
      // Get initial values
      const initialWatchText = baseWatchCountEl?.textContent || '';
      const initialWatchMatch = initialWatchText.match(/Base Watch Calls: (\d+)/);
      const initialWatchCount = initialWatchMatch ? parseInt(initialWatchMatch[1], 10) : 0;
      
      const initialCountText = baseCountEl?.textContent || '';
      const initialCountMatch = initialCountText.match(/Base Count: (\d+)/);
      const initialCount = initialCountMatch ? parseInt(initialCountMatch[1], 10) : 0;
      
      button?.click();
      
      // Wait for watch handler to be called
      await browser.waitUntil(async () => {
        const updatedWatchText = baseWatchCountEl?.textContent || '';
        const updatedWatchMatch = updatedWatchText.match(/Base Watch Calls: (\d+)/);
        const updatedWatchCount = updatedWatchMatch ? parseInt(updatedWatchMatch[1], 10) : 0;
        return updatedWatchCount > initialWatchCount;
      }, { timeout: 3000 });
      
      // Verify count was incremented
      const finalCountText = baseCountEl?.textContent || '';
      const finalCountMatch = finalCountText.match(/Base Count: (\d+)/);
      const finalCount = finalCountMatch ? parseInt(finalCountMatch[1], 10) : 0;
      expect(finalCount).toBe(initialCount + 1);
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-watch/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.watch-info'), { timeout: 5000 });
    });

    it('inherits @Watch decorators in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-base-prop') as HTMLButtonElement;
      
      const initialCount = component?.baseWatchCallCount || 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const count = component?.baseWatchCallCount || 0;
        return count > initialCount;
      }, { timeout: 3000 });
      
      const finalCount = component?.baseWatchCallCount || 0;
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('handles child @Watch decorators in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-child-prop') as HTMLButtonElement;
      
      const initialCount = component?.childWatchCallCount || 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const count = component?.childWatchCallCount || 0;
        return count > initialCount;
      }, { timeout: 3000 });
      
      const finalCount = component?.childWatchCallCount || 0;
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('watch handler override works in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-watch');
      const button = frameContent.querySelector('.update-override-prop') as HTMLButtonElement;
      
      // Reset logs
      await component.resetWatchLogs();
      
      const initialChildCount = component?.childWatchCallCount || 0;
      const initialBaseCount = component?.baseWatchCallCount || 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const childCount = component?.childWatchCallCount || 0;
        return childCount > initialChildCount;
      }, { timeout: 3000 });
      
      // Child handler should be called
      const finalChildCount = component?.childWatchCallCount || 0;
      expect(finalChildCount).toBeGreaterThan(initialChildCount);
      
      // Base handler should NOT be called (override behavior)
      const finalBaseCount = component?.baseWatchCallCount || 0;
      expect(finalBaseCount).toBe(initialBaseCount);
    });
  });
});

