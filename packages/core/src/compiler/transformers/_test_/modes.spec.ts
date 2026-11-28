import { describe, expect, it } from 'vitest';

import { transpileModule } from './transpile';

describe('config.modes validation', () => {
  it('does not error when config.modes is not declared, even with arbitrary mode keys', () => {
    expect(() =>
      transpileModule(`
        @Component({
          tag: 'cmp-a',
          styleUrls: { anything: 'foo.css', goes: 'bar.css' }
        })
        export class CmpA {}
      `),
    ).not.toThrow();
  });

  it('throws for a typo in a mode key', () => {
    let error: Error | undefined;
    try {
      transpileModule(
        `
        @Component({
          tag: 'cmp-a',
          styleUrls: { ios: 'foo.ios.css', tyop: 'foo.tyop.css' }
        })
        export class CmpA {}
      `,
        { modes: ['ios', 'md'] },
      );
    } catch (err: unknown) {
      error = err as Error;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Invalid mode "tyop" in "styleUrls"');
  });

  it('throws when a required mode is missing', () => {
    let error: Error | undefined;
    try {
      transpileModule(
        `
        @Component({
          tag: 'cmp-a',
          styleUrls: { md: 'foo.md.css' }
        })
        export class CmpA {}
      `,
        { modes: [{ mode: 'ios', required: true }, 'md'] },
      );
    } catch (err: unknown) {
      error = err as Error;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Missing required mode: ios');
  });

  it('does not error when all used modes are declared', () => {
    expect(() =>
      transpileModule(
        `
        @Component({
          tag: 'cmp-a',
          styleUrls: { ios: 'foo.ios.css', md: 'foo.md.css' }
        })
        export class CmpA {}
      `,
        { modes: ['ios', { mode: 'md', required: true }] },
      ),
    ).not.toThrow();
  });
});
