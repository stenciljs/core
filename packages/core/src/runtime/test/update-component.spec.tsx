import { Component, h, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('update-component', () => {
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
      const queueMicrotaskSpy = jest.spyOn(global, 'queueMicrotask');

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
      const queueMicrotaskSpy = jest.spyOn(global, 'queueMicrotask');

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
