import { createSystem } from '../../../compiler/sys/stencil-sys';
import { ConfigFlags, createConfigFlags } from '../../config-flags';
import { hasDebug, hasVerbose, isInteractive, tryFn, uuidv4 } from '../helpers';

describe('hasDebug', () => {
  it('returns true when the "debug" flag is true', () => {
    const flags = createConfigFlags({
      debug: true,
    });

    expect(hasDebug(flags)).toBe(true);
  });

  it('returns false when the "debug" flag is false', () => {
    const flags = createConfigFlags({
      debug: false,
    });

    expect(hasDebug(flags)).toBe(false);
  });

  it('returns false when a flag is not passed', () => {
    const flags = createConfigFlags({});

    expect(hasDebug(flags)).toBe(false);
  });
});

describe('hasVerbose', () => {
  it.each<Partial<ConfigFlags>>([
    { debug: true, verbose: false },
    { debug: false, verbose: true },
    { debug: false, verbose: false },
  ])('returns false when debug=$debug and verbose=$verbose', (flagOverrides) => {
    const flags = createConfigFlags(flagOverrides);

    expect(hasVerbose(flags)).toBe(false);
  });

  it('returns true when debug=true and verbose=true', () => {
    const flags = createConfigFlags({
      debug: true,
      verbose: true,
    });

    expect(hasVerbose(flags)).toBe(true);
  });
});

describe('uuidv4', () => {
  it('outputs a UUID', () => {
    const pattern = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    const uuid = uuidv4();
    expect(!!uuid.match(pattern)).toBe(true);
  });
});

describe('isInteractive', () => {
  const sys = createSystem();

  it('returns false by default', () => {
    const result = isInteractive(sys, createConfigFlags({ ci: false }), { ci: false, tty: false });
    expect(result).toBe(false);
  });

  it('returns false when tty is false', () => {
    const result = isInteractive(sys, createConfigFlags({ ci: true }), { ci: true, tty: false });
    expect(result).toBe(false);
  });

  it('returns false when ci is true', () => {
    const result = isInteractive(sys, createConfigFlags({ ci: true }), { ci: true, tty: true });
    expect(result).toBe(false);
  });

  it('returns true when tty is true and ci is false', () => {
    const result = isInteractive(sys, createConfigFlags({ ci: false }), { ci: false, tty: true });
    expect(result).toBe(true);
  });
});

describe('tryFn', () => {
  it('handles failures correctly', async () => {
    const result = await tryFn(async () => {
      throw new Error('Uh oh!');
    });

    expect(result).toBe(null);
  });

  it('handles success correctly', async () => {
    const result = await tryFn(async () => {
      return true;
    });

    expect(result).toBe(true);
  });

  it('handles returning false correctly', async () => {
    const result = await tryFn(async () => {
      return false;
    });

    expect(result).toBe(false);
  });
});
