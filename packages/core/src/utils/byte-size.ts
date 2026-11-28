/**
 * Used to learn the size of a string in bytes.
 *
 * @param str The string to measure
 * @returns number
 */
export const byteSize = (str: string) => Buffer.byteLength(str, 'utf8');
