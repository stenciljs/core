import { signal } from '@stencil/core/signals';

export const sharedCount = signal(0);
export const sharedLabel = signal('hello');
