import { Component, h, Prop, State } from '@stencil/core';
import { expect, describe, it, vi } from '@stencil/vitest';

import { newSpecPage } from '../../testing';

describe('update-component', () => {
  describe('scheduleUpdate - re-entrancy guard', () => {
    it('should coalesce a state write during render() into a single follow-up render under taskQueue: immediate', async () => {
      let renderCount = 0;

      @Component({ tag: 'cmp-reentry' })
      class CmpReentry {
        @Prop() trigger = 0;
        @State() measured = 0;

        render() {
          renderCount++;
          // guards the test itself against hanging if the re-entrancy guard regresses
          if (renderCount > 10) {
            throw new Error('render() re-entered unboundedly');
          }
          this.measured++;
          return h('div', null, this.measured);
        }
      }

      const page = await newSpecPage({
        components: [CmpReentry],
        html: `<cmp-reentry></cmp-reentry>`,
      });

      // simulate `taskQueue: 'immediate'`, where BUILD.taskQueue is `false`
      page.build.taskQueue = false;

      renderCount = 0;
      page.rootInstance.trigger = 1;
      await page.waitForChanges();

      // one external update should cause exactly one follow-up render, even though
      // `render()` writes state on every pass (the re-entrancy guard should dedupe it)
      expect(renderCount).toBe(1);
    });
  });

  describe('scheduleUpdate - initial load with queueMicrotask', () => {
    @Component({
      tag: 'test-cmp',
    })
    class TestCmp {
      @State() count = 0;

      render() {
        return h('div', null, `Count: ${this.count}`);
      }
    }

    it('should use queueMicrotask for initial load dispatch', async () => {
      const queueMicrotaskSpy = vi.spyOn(global, 'queueMicrotask');

      const page = await newSpecPage({
        components: [TestCmp],
        html: `<test-cmp></test-cmp>`,
      });

      expect(queueMicrotaskSpy).toHaveBeenCalled();
      expect(page.root.textContent).toContain('Count: 0');

      queueMicrotaskSpy.mockRestore();
    });

    it('should not interfere with following render dispatch events', async () => {
      let componentWillRender = 0;
      const queueMicrotaskSpy = vi.spyOn(global, 'queueMicrotask');

      @Component({
        tag: 'update-test-cmp',
      })
      class UpdateTestCmp {
        @State() count = 0;

        increment() {
          this.count++;
        }

        componentWillRender() {
          componentWillRender++;
        }

        render() {
          return h('div', null, `Count: ${this.count}`);
        }
      }

      const page = await newSpecPage({
        components: [UpdateTestCmp],
        html: `<update-test-cmp></update-test-cmp>`,
      });

      expect(page.root.textContent).toBe('Count: 0');
      expect(componentWillRender).toBe(1);

      page.rootInstance.increment();
      await page.waitForChanges();

      expect(page.root.textContent).toContain('Count: 1');
      expect(queueMicrotaskSpy).toHaveBeenCalledTimes(1);
      expect(componentWillRender).toBe(2);

      queueMicrotaskSpy.mockRestore();
    });
  });
});
