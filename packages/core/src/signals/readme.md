# signals

Public entry point for `@stencil/core/signals` - opt-in signal-backed reactivity, built on `@preact/signals-core`.

## Overview

With `extras.signalBacking: true` in `stencil.config.ts`, `@Prop` and `@State` members are backed by signals internally - no API changes for component authors. This module exposes that mechanism to consumers for cross-component or cross-framework interop, without polling or custom events.

## Exports

| Export                | Purpose                                                              |
| ---------------------- | ---------------------------------------------------------------------- |
| `signal`, `computed`, `effect`, `batch`, `untracked` | Re-exported from `@preact/signals-core`                |
| `getSignal<T>(elm, prop)` | Returns the `ReadonlySignal` backing a `@Prop` member on a host element (`null` if not signal-backed). `@State` is internal and not exposed this way. |
| `@Effect()`            | Method decorator - wraps the method in `effect()`, auto-tracking any signals read inside; cleaned up on disconnect |
| `STENCIL_SIGNALS_SYMBOL` | `Symbol.for('stencil.signals')` - lets framework adapters read signal values off the host element without importing `@stencil/core` |

## Relationship to `runtime/signals.ts`

This directory is the public surface; `../runtime/signals.ts` has the internal implementation that wires `@Prop`/`@State` proxying to actual signal instances.

## The JSX bypass only fires at the literal vdom slot

Placing a signal directly as a vdom child or attribute value skips `render()`/vdom-diffing entirely for that node - the runtime detects the signal via `isSignalLike()` at exactly two call sites (`h()` for children/`class`, `setAccessor()` for attributes/props) and subscribes an `effect()` that patches just that DOM node. Writes still go through `.value` as usual:

```ts
import { count } from './count'; // exported signal(0)

@Component({ tag: 'my-counter' })
export class MyCounter {
  private increment = () => {
    count.value = count.value + 1;
  };

  render() {
    return <button onClick={this.increment}>{count}</button>;
  }
}
```

`{count}` - the bare signal - is what makes the bypass fire. `{count.value}` would render the current count once and then never update; the button's text would freeze after the first click, since Stencil would have no way of knowing `render()` needs to run again.

For anything that needs a signal's value to affect *how* `render()` runs (branches, derived lists, computed strings), route it through `@State`:

```ts
@State() private isEven = false;

@Effect()
private syncIsEven() {
  this.isEven = count.value % 2 === 0;
}

render() {
  return this.isEven ? <a-thing /> : <empty-state />;
}
```

`@State`/`@Prop` changes always trigger a normal, tracked re-render - `@Effect()` is the supported bridge between an external signal and Stencil's own re-render trigger.
