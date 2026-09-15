import { describe, expect, it } from 'vitest';

import { AppHome } from './app-home';

describe('app-home', () => {
  it('builds', () => {
    expect(new AppHome()).toBeTruthy();
  });
});
