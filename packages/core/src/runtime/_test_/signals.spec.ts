import { signal, computed } from '@preact/signals-core';
import { describe, it, expect, beforeEach } from '@stencil/vitest';
import { vi } from 'vitest';
import type * as d from '@stencil/core';

import { Effect } from '../../signals';
import { HOST_FLAGS, MEMBER_FLAGS, WATCH_FLAGS } from '../../utils/constants';
import { initializeSignals, STENCIL_SIGNALS_SYMBOL } from '../signals';

vi.mock('../update-component', () => ({
  scheduleUpdate: vi.fn(),
  safeCall: vi.fn(),
}));

import { scheduleUpdate } from '../update-component';

// helpers

const makeElm = () => document.createElement('div') as unknown as d.HostElement;

const makeHostRef = (overrides: Partial<d.HostRef> = {}): d.HostRef =>
  ({
    $flags$: 0,
    $hostElement$: makeElm(),
    $cmpMeta$: { $flags$: 0, $tagName$: 'test-cmp' },
    $instanceValues$: new Map(),
    $serializerValues$: new Map(),
    $renderCount$: 0,
    ...overrides,
  }) as d.HostRef;

const makeCmpMeta = (
  members: Record<string, number>,
  watchers?: d.ComponentRuntimeMeta['$watchers$'],
): d.ComponentRuntimeMeta => ({
  $flags$: 0,
  $tagName$: 'test-cmp',
  $members$: Object.fromEntries(
    Object.entries(members).map(([name, flags]) => [name, [flags] as d.ComponentRuntimeMember]),
  ),
  $watchers$: watchers,
});

// initializeSignals

describe('initializeSignals', () => {
  let elm: d.HostElement;

  beforeEach(() => {
    elm = makeElm();
    vi.mocked(scheduleUpdate).mockClear();
  });

  // initialization

  describe('initialization', () => {
    it('creates $signalValues$ map on first call', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$).toBeInstanceOf(Map);
    });

    it('is a no-op if $signalValues$ already exists (HMR re-entry guard)', () => {
      const existing = new Map();
      const hostRef = makeHostRef({ $signalValues$: existing });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$).toBe(existing);
      expect(hostRef.$signalValues$.size).toBe(0);
    });

    it('creates a signal for each @State member', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State, label: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$!.has('count')).toBe(true);
      expect(hostRef.$signalValues$!.has('label')).toBe(true);
    });

    it('creates a signal for @Prop members (string, number, boolean, any)', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({
        name: MEMBER_FLAGS.String,
        age: MEMBER_FLAGS.Number,
        active: MEMBER_FLAGS.Boolean,
        data: MEMBER_FLAGS.Any,
      });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$!.size).toBe(4);
    });

    it('skips non-PropLike members (Method, Event, Element)', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({
        doSomething: MEMBER_FLAGS.Method,
        myEvent: MEMBER_FLAGS.Event,
        myEl: MEMBER_FLAGS.Element,
      });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$!.size).toBe(0);
    });

    it('seeds signal value from $instanceValues$', () => {
      const hostRef = makeHostRef({
        $instanceValues$: new Map([['count', 42]]),
      });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$!.get('count')!.value).toBe(42);
    });

    it('seeds signal with undefined when member not in $instanceValues$', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$!.get('count')!.value).toBeUndefined();
    });

    it('sets $signalCleanup$ to a disposer function', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(typeof hostRef.$signalCleanup$).toBe('function');
    });

    it('handles components with no members', () => {
      const hostRef = makeHostRef();
      const cmpMeta: d.ComponentRuntimeMeta = { $flags$: 0, $tagName$: 'test-cmp' };
      initializeSignals(elm, hostRef, cmpMeta);
      expect(hostRef.$signalValues$!.size).toBe(0);
    });
  });

  // scheduling effect

  describe('scheduling effect', () => {
    it('does NOT call scheduleUpdate on initial setup (hasRendered not set)', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it('calls scheduleUpdate when signal value changes after hasRendered', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('count')!.value = 1;

      expect(scheduleUpdate).toHaveBeenCalledOnce();
      expect(scheduleUpdate).toHaveBeenCalledWith(hostRef, false);
    });

    it('does NOT call scheduleUpdate again when isQueuedForUpdate is set', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered | HOST_FLAGS.isQueuedForUpdate;
      hostRef.$signalValues$!.get('count')!.value = 1;

      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it('calls scheduleUpdate independently for each member', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ a: MEMBER_FLAGS.State, b: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('a')!.value = 1;
      hostRef.$signalValues$!.get('b')!.value = 2;

      expect(scheduleUpdate).toHaveBeenCalledTimes(2);
    });

    it('does NOT schedule a second update when isQueuedForUpdate is set after first change', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ a: MEMBER_FLAGS.State, b: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('a')!.value = 1;
      // Simulate: the first scheduleUpdate queued the render
      hostRef.$flags$ |= HOST_FLAGS.isQueuedForUpdate;
      hostRef.$signalValues$!.get('b')!.value = 2;

      expect(scheduleUpdate).toHaveBeenCalledOnce();
    });
  });

  // componentShouldUpdate

  describe('componentShouldUpdate veto', () => {
    it('skips scheduleUpdate when componentShouldUpdate returns false', () => {
      const instance = { componentShouldUpdate: vi.fn().mockReturnValue(false) };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('count')!.value = 1;

      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it('calls componentShouldUpdate with (newVal, prevVal, memberName)', () => {
      const instance = { componentShouldUpdate: vi.fn().mockReturnValue(true) };
      const hostRef = makeHostRef({
        $lazyInstance$: instance as any,
        $instanceValues$: new Map([['count', 0]]),
      });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('count')!.value = 5;

      expect(instance.componentShouldUpdate).toHaveBeenCalledWith(5, 0, 'count');
    });

    it('still calls scheduleUpdate when componentShouldUpdate returns true', () => {
      const instance = { componentShouldUpdate: vi.fn().mockReturnValue(true) };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('count')!.value = 1;

      expect(scheduleUpdate).toHaveBeenCalledOnce();
    });

    it('still calls scheduleUpdate when componentShouldUpdate is absent', () => {
      const instance = {};
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalValues$!.get('count')!.value = 1;

      expect(scheduleUpdate).toHaveBeenCalledOnce();
    });

    it('skips scheduleUpdate when veto AND isQueuedForUpdate (falls through, already queued)', () => {
      const instance = { componentShouldUpdate: vi.fn().mockReturnValue(false) };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered | HOST_FLAGS.isQueuedForUpdate;
      hostRef.$signalValues$!.get('count')!.value = 1;

      // componentShouldUpdate veto is ignored when already queued,
      // but scheduleUpdate is still not called (already queued guard)
      expect(scheduleUpdate).not.toHaveBeenCalled();
    });
  });

  // watcher effects

  describe('watcher effects', () => {
    it('fires watcher when signal changes and isWatchReady is set', () => {
      const instance = { onCountChange: vi.fn() };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State }, { count: [{ onCountChange: 0 }] });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.isWatchReady;
      hostRef.$signalValues$!.get('count')!.value = 99;

      expect(instance.onCountChange).toHaveBeenCalledOnce();
      expect(instance.onCountChange).toHaveBeenCalledWith(99, undefined, 'count');
    });

    it('does NOT fire watcher on first run when not isWatchReady and not Immediate', () => {
      const instance = { onCountChange: vi.fn() };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State }, { count: [{ onCountChange: 0 }] });
      initializeSignals(elm, hostRef, cmpMeta);
      expect(instance.onCountChange).not.toHaveBeenCalled();
    });

    it('fires watcher on first run when WATCH_FLAGS.Immediate is set', () => {
      const instance = { onCountChange: vi.fn() };
      const hostRef = makeHostRef({
        $lazyInstance$: instance as any,
        $instanceValues$: new Map([['count', 10]]),
      });
      const cmpMeta = makeCmpMeta(
        { count: MEMBER_FLAGS.State },
        { count: [{ onCountChange: WATCH_FLAGS.Immediate }] },
      );
      initializeSignals(elm, hostRef, cmpMeta);
      // Immediate watcher fires on first effect run with (initialVal, initialVal, memberName)
      expect(instance.onCountChange).toHaveBeenCalledOnce();
      expect(instance.onCountChange).toHaveBeenCalledWith(10, 10, 'count');
    });

    it('passes (newVal, oldVal, memberName) to watcher', () => {
      const instance = { onCountChange: vi.fn() };
      const hostRef = makeHostRef({
        $lazyInstance$: instance as any,
        $instanceValues$: new Map([['count', 5]]),
      });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State }, { count: [{ onCountChange: 0 }] });
      initializeSignals(elm, hostRef, cmpMeta);
      hostRef.$flags$ |= HOST_FLAGS.isWatchReady;

      hostRef.$signalValues$!.get('count')!.value = 20;
      expect(instance.onCountChange).toHaveBeenCalledWith(20, 5, 'count');

      hostRef.$signalValues$!.get('count')!.value = 30;
      expect(instance.onCountChange).toHaveBeenCalledWith(30, 20, 'count');
    });

    it('supports multiple watcher methods on the same member', () => {
      const instance = { onCountChange: vi.fn(), countChanged: vi.fn() };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta(
        { count: MEMBER_FLAGS.State },
        { count: [{ onCountChange: 0 }, { countChanged: 0 }] },
      );
      initializeSignals(elm, hostRef, cmpMeta);
      hostRef.$flags$ |= HOST_FLAGS.isWatchReady;

      hostRef.$signalValues$!.get('count')!.value = 1;
      expect(instance.onCountChange).toHaveBeenCalledOnce();
      expect(instance.countChanged).toHaveBeenCalledOnce();
    });

    it('catches and swallows errors thrown by a watcher', () => {
      const instance = {
        onCountChange: vi.fn().mockImplementation(() => {
          throw new Error('boom');
        }),
      };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State }, { count: [{ onCountChange: 0 }] });
      initializeSignals(elm, hostRef, cmpMeta);
      hostRef.$flags$ |= HOST_FLAGS.isWatchReady;

      expect(() => {
        hostRef.$signalValues$!.get('count')!.value = 1;
      }).not.toThrow();
    });

    it('does not set up watcher effects when $watchers$ is absent', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State }); // no watchers
      expect(() => initializeSignals(elm, hostRef, cmpMeta)).not.toThrow();
      expect(hostRef.$signalValues$!.has('count')).toBe(true);
    });
  });

  // @Effect() wiring

  describe('@Effect() wiring', () => {
    it('calls effect methods immediately on initialization', () => {
      const myEffect = vi.fn();
      const instance = { __stencilEffects: ['myEffect'], myEffect };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      initializeSignals(elm, hostRef, makeCmpMeta({}));
      expect(myEffect).toHaveBeenCalledOnce();
    });

    it('re-runs when a signal read inside the effect changes', () => {
      const hostRef = makeHostRef({ $instanceValues$: new Map([['count', 0]]) });
      let callCount = 0;
      const instance = {
        __stencilEffects: ['track'],
        track() {
          hostRef.$signalValues$?.get('count')?.value; // establish tracking
          callCount++;
        },
      };
      hostRef.$lazyInstance$ = instance as any;
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      callCount = 0;
      hostRef.$signalValues$!.get('count')!.value = 99;
      expect(callCount).toBe(1);
    });

    it('does NOT re-run for signals not read inside the effect', () => {
      const hostRef = makeHostRef({
        $instanceValues$: new Map([
          ['a', 0],
          ['b', 0],
        ]),
      });
      let callCount = 0;
      const instance = {
        __stencilEffects: ['trackA'],
        trackA() {
          hostRef.$signalValues$?.get('a')?.value; // only tracks 'a'
          callCount++;
        },
      };
      hostRef.$lazyInstance$ = instance as any;
      initializeSignals(
        elm,
        hostRef,
        makeCmpMeta({ a: MEMBER_FLAGS.State, b: MEMBER_FLAGS.State }),
      );

      callCount = 0;
      hostRef.$signalValues$!.get('b')!.value = 1;
      expect(callCount).toBe(0);
    });

    it('is disposed by $signalCleanup$()', () => {
      const hostRef = makeHostRef({ $instanceValues$: new Map([['count', 0]]) });
      let callCount = 0;
      const instance = {
        __stencilEffects: ['track'],
        track() {
          hostRef.$signalValues$?.get('count')?.value;
          callCount++;
        },
      };
      hostRef.$lazyInstance$ = instance as any;
      initializeSignals(elm, hostRef, makeCmpMeta({ count: MEMBER_FLAGS.State }));

      hostRef.$signalCleanup$!();
      callCount = 0;
      hostRef.$signalValues$!.get('count')!.value = 99;
      expect(callCount).toBe(0);
    });

    it('catches and swallows errors thrown by an effect method', () => {
      const instance = {
        __stencilEffects: ['bad'],
        bad: vi.fn().mockImplementation(() => {
          throw new Error('oops');
        }),
      };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      expect(() => initializeSignals(elm, hostRef, makeCmpMeta({}))).not.toThrow();
    });

    it('wires multiple @Effect() methods independently', () => {
      const effectA = vi.fn();
      const effectB = vi.fn();
      const instance = { __stencilEffects: ['effectA', 'effectB'], effectA, effectB };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      initializeSignals(elm, hostRef, makeCmpMeta({}));
      expect(effectA).toHaveBeenCalledOnce();
      expect(effectB).toHaveBeenCalledOnce();
    });

    it('is a no-op when instance has no __stencilEffects', () => {
      const hostRef = makeHostRef({ $lazyInstance$: {} as any });
      expect(() => initializeSignals(elm, hostRef, makeCmpMeta({}))).not.toThrow();
    });
  });

  // cleanup

  describe('$signalCleanup$', () => {
    it('disposes scheduling effects - changes no longer trigger scheduleUpdate', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State });
      initializeSignals(elm, hostRef, cmpMeta);

      hostRef.$flags$ |= HOST_FLAGS.hasRendered;
      hostRef.$signalCleanup$!();

      hostRef.$signalValues$!.get('count')!.value = 1;
      expect(scheduleUpdate).not.toHaveBeenCalled();
    });

    it('disposes watcher effects - watcher no longer fires after cleanup', () => {
      const instance = { onCountChange: vi.fn() };
      const hostRef = makeHostRef({ $lazyInstance$: instance as any });
      const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.State }, { count: [{ onCountChange: 0 }] });
      initializeSignals(elm, hostRef, cmpMeta);
      hostRef.$flags$ |= HOST_FLAGS.isWatchReady;

      hostRef.$signalCleanup$!();
      hostRef.$signalValues$!.get('count')!.value = 1;

      expect(instance.onCountChange).not.toHaveBeenCalled();
    });

    it('disposes effects for all members', () => {
      const hostRef = makeHostRef();
      const cmpMeta = makeCmpMeta({
        a: MEMBER_FLAGS.State,
        b: MEMBER_FLAGS.State,
        c: MEMBER_FLAGS.State,
      });
      initializeSignals(elm, hostRef, cmpMeta);
      hostRef.$flags$ |= HOST_FLAGS.hasRendered;

      hostRef.$signalCleanup$!();

      hostRef.$signalValues$!.get('a')!.value = 1;
      hostRef.$signalValues$!.get('b')!.value = 2;
      hostRef.$signalValues$!.get('c')!.value = 3;

      expect(scheduleUpdate).not.toHaveBeenCalled();
    });
  });
});

// Effect decorator

describe('Effect decorator', () => {
  it('adds the method name to prototype.__stencilEffects', () => {
    class TestCmp {
      @Effect()
      myEffect() {}
    }
    expect((TestCmp.prototype as any).__stencilEffects).toContain('myEffect');
  });

  it('accumulates multiple @Effect() methods in order', () => {
    class TestCmp {
      @Effect()
      effectA() {}
      @Effect()
      effectB() {}
    }
    expect((TestCmp.prototype as any).__stencilEffects).toEqual(['effectA', 'effectB']);
  });

  it('does not alter the original method behavior', () => {
    class TestCmp {
      @Effect()
      greet() {
        return 'hello';
      }
    }
    expect(new TestCmp().greet()).toBe('hello');
  });
});

// STENCIL_SIGNALS_SYMBOL exposure

describe('STENCIL_SIGNALS_SYMBOL', () => {
  it('exposes @Prop signals on the element after initializeSignals', () => {
    const elm = makeElm();
    const hostRef = makeHostRef({ $instanceValues$: new Map([['count', 1]]) });
    const cmpMeta = makeCmpMeta({ count: MEMBER_FLAGS.String });
    initializeSignals(elm, hostRef, cmpMeta);
    const map = (elm as any)[STENCIL_SIGNALS_SYMBOL] as Map<string, any>;
    expect(map).toBeInstanceOf(Map);
    expect(map.get('count').value).toBe(1);
  });

  it('does not expose @State signals', () => {
    const elm = makeElm();
    const hostRef = makeHostRef({ $instanceValues$: new Map([['count', 42]]) });
    initializeSignals(elm, hostRef, makeCmpMeta({ count: MEMBER_FLAGS.State }));
    const map = (elm as any)[STENCIL_SIGNALS_SYMBOL] as Map<string, any>;
    expect(map.has('count')).toBe(false);
  });

  it('is cleared to undefined after $signalCleanup$()', () => {
    const elm = makeElm();
    const hostRef = makeHostRef();
    initializeSignals(elm, hostRef, makeCmpMeta({ count: MEMBER_FLAGS.State }));
    hostRef.$signalCleanup$!();
    expect((elm as any)[STENCIL_SIGNALS_SYMBOL]).toBeUndefined();
  });

  it('is an empty map when there are no PropLike members', () => {
    const elm = makeElm();
    const hostRef = makeHostRef();
    initializeSignals(elm, hostRef, makeCmpMeta({ doSomething: MEMBER_FLAGS.Method }));
    const map = (elm as any)[STENCIL_SIGNALS_SYMBOL] as Map<string, any>;
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(0);
  });
});

// computed() as class field

describe('computed() class field', () => {
  it('returns a ReadonlySignal wrapping the derived value', () => {
    const src = signal(42);
    class TestCmp {
      answer = computed(() => src.value);
    }
    expect(new TestCmp().answer.value).toBe(42);
  });

  it('tracks signal dependencies and updates when they change', () => {
    const count = signal(0);
    class TestCmp {
      doubled = computed(() => count.value * 2);
    }
    const instance = new TestCmp();
    expect(instance.doubled.value).toBe(0);
    count.value = 5;
    expect(instance.doubled.value).toBe(10);
  });

  it('memoizes - fn not re-evaluated when dependencies unchanged', () => {
    const count = signal(0);
    let computeCount = 0;
    class TestCmp {
      doubled = computed(() => {
        computeCount++;
        return count.value * 2;
      });
    }
    const instance = new TestCmp();
    instance.doubled.value;
    instance.doubled.value; // second read - cached
    expect(computeCount).toBe(1);
  });

  it('recomputes when a tracked signal changes', () => {
    const count = signal(0);
    let computeCount = 0;
    class TestCmp {
      doubled = computed(() => {
        computeCount++;
        return count.value * 2;
      });
    }
    const instance = new TestCmp();
    instance.doubled.value; // prime
    computeCount = 0;
    count.value = 3;
    instance.doubled.value;
    expect(computeCount).toBe(1);
  });

  it('creates an independent computed per instance', () => {
    const count = signal(1);
    class TestCmp {
      doubled = computed(() => count.value * 2);
    }
    const a = new TestCmp();
    const b = new TestCmp();
    count.value = 4;
    expect(a.doubled.value).toBe(8);
    expect(b.doubled.value).toBe(8);
  });
});
