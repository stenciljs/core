import { expect, describe, it, beforeEach } from '@stencil/vitest';
import { plt } from 'virtual:platform';

import { setNonce } from '../nonce';

describe('setNonce', () => {
  beforeEach(() => {
    plt.$nonce$ = undefined;
  });

  it('should assign the nonce value to the runtime platform', () => {
    setNonce('nonce-1234');

    expect(plt.$nonce$).toBe('nonce-1234');
  });
});
