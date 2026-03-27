import { format } from './utils';
import { describe, it, expect } from 'vitest';

describe('format', () => {
  it('returns empty string for no names defined', () => {
    // @ts-ignore - chill out TypeScript, we're testing here
    expect(format(undefined, undefined, undefined)).toEqual('');
  });

  it('formats just first names', () => {
    // @ts-ignore - chill out TypeScript, we're testing here
    expect(format('Joseph', undefined, undefined)).toEqual('Joseph');
  });

  it('formats first and last names', () => {
    // @ts-ignore - chill out TypeScript, we're testing here
    expect(format('Joseph', undefined, 'Publique')).toEqual('Joseph Publique');
  });

  it('formats first, middle and last names', () => {
    // @ts-ignore - chill out TypeScript, we're testing here
    expect(format('Joseph', 'Quincy', 'Publique')).toEqual('Joseph Quincy Publique');
  });
});
