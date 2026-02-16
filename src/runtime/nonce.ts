import { plt } from '@platform';

/**
 * Assigns the given value to the nonce property on the runtime platform object.
 * During runtime, this value is used to set the nonce attribute on all dynamically created script and style tags.
 * @param nonce The value to be assigned to the platform nonce property.
 * @returns void
 */
export const setNonce = (nonce: string) => (plt.$nonce$ = nonce);
