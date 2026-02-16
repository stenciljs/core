import * as result from '../result';

describe('Result type and utility functions', () => {
  it('result.ok should let you create an Ok', () => {
    const ok = result.ok(1);
    expect(ok.isOk).toBe(true);
    expect(ok.isErr).toBe(false);
    expect(result.unwrap(ok)).toBe(1);
  });

  it('result.err should let you create an Err', () => {
    const err = result.err(1);
    expect(err.isOk).toBe(false);
    expect(err.isErr).toBe(true);
    expect(err.value).toBe(1);
    expect(() => result.unwrap(err)).toThrow();
  });

  it('result.map should let you map across an Ok value', () => {
    const ok = result.ok(1);
    const mapped = result.map(ok, (x) => x + 1);
    expect(result.unwrap(mapped)).toBe(2);
  });

  it('result.map should let you map across an Ok value while changing its type', () => {
    const ok = result.ok(1);
    const mapped = result.map(ok, (x) => x.toString());
    expect(result.unwrap(mapped)).toBe('1');
  });

  it('result.map should let you map with an async function', async () => {
    const ok = result.ok(1);
    const mapped = await result.map(ok, async (x) => x + 1);
    expect(result.unwrap(mapped)).toBe(2);
  });
});
