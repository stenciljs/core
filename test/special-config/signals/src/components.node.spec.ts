import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type ReadonlySignal } from '@stencil/core/signals';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { STENCIL_SIGNALS_SYMBOL } from './components';

const componentsDts = readFileSync(join(import.meta.dirname, 'components.d.ts'), 'utf-8');

describe('components.d.ts', () => {
  it('does not reference @preact/signals-core', () => {
    expect(componentsDts).not.toContain('@preact/signals-core');
  });

  it('has a typed signal map on components with @Prop members', () => {
    expect(componentsDts).toContain(
      'readonly [STENCIL_SIGNALS_SYMBOL]?: ReadonlyMap<"label" | "value", ReadonlySignal<unknown>>',
    );
  });
});

describe('HTMLSignalEffectCmpElement types', () => {
  it('exposes the signal map with correct prop-name keys', () => {
    expectTypeOf<HTMLSignalEffectCmpElement[typeof STENCIL_SIGNALS_SYMBOL]>().toEqualTypeOf<
      ReadonlyMap<'multiplier', ReadonlySignal<unknown>> | undefined
    >();
  });
});
