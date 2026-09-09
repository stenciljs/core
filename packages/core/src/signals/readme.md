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
