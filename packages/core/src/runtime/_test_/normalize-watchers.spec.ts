import { expect, describe, it } from '@stencil/vitest';

import { normalizeWatchers } from '../normalize-watchers';

describe('normalizeWatchers', () => {
  it('returns undefined when input is undefined', () => {
    expect(normalizeWatchers(undefined)).toBeUndefined();
  });

  it('returns undefined when input is an empty object', () => {
    expect(normalizeWatchers({})).toBeUndefined();
  });

  it('converts the legacy string-array format emitted by pre-4.39.x Stencil compilers', () => {
    // Pre-4.39.x compiler output: { "min": ["minChanged"] }
    const legacy = { min: ['minChanged'] } as any;
    expect(normalizeWatchers(legacy)).toEqual({ min: [{ minChanged: 0 }] });
  });

  it('returns the same reference for modern-format input (no allocation)', () => {
    // Post-4.39.x compiler output: { "min": [{ "minChanged": 0 }] }
    const modern = { min: [{ minChanged: 0 }] };
    expect(normalizeWatchers(modern)).toBe(modern);
  });

  it('preserves WATCH_FLAGS.Immediate (flag = 1) on modern-format entries', () => {
    // @Watch('prop', { immediate: true }) emits flag value 1
    const immediate = { min: [{ minChanged: 1 }] };
    expect(normalizeWatchers(immediate)).toEqual({ min: [{ minChanged: 1 }] });
  });

  it('handles multiple props each with multiple watcher methods in legacy format', () => {
    const legacy = { min: ['minChanged', 'otherHandler'], max: ['maxChanged'] } as any;
    expect(normalizeWatchers(legacy)).toEqual({
      min: [{ minChanged: 0 }, { otherHandler: 0 }],
      max: [{ maxChanged: 0 }],
    });
  });

  it('handles a mix of legacy string and modern object entries for the same prop', () => {
    const mixed = { min: ['legacyHandler', { modernHandler: 1 }] } as any;
    expect(normalizeWatchers(mixed)).toEqual({
      min: [{ legacyHandler: 0 }, { modernHandler: 1 }],
    });
  });

  it('handles multiple props each with multiple watcher methods in modern format', () => {
    const modern = { min: [{ minChanged: 0 }, { otherHandler: 1 }], max: [{ maxChanged: 0 }] };
    expect(normalizeWatchers(modern)).toEqual({
      min: [{ minChanged: 0 }, { otherHandler: 1 }],
      max: [{ maxChanged: 0 }],
    });
  });
});
