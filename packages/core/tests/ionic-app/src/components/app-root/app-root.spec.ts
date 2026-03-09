import { describe, expect, it } from 'vitest';
import { AppRoot } from './app-root';

describe('app-root', () => {
  it('builds', () => {
    expect(new AppRoot()).toBeTruthy();
  });
});
