import { isString } from './helpers';

/**
 * Determines whether a string should be considered a remote url or not.
 *
 * This helper only checks the provided string to evaluate is one of a few pre-defined schemes, and should not be
 * considered all-encompassing
 *
 * @param p the string to evaluate
 * @returns `true` if the provided string is a remote url, `false` otherwise
 */
export const isRemoteUrl = (p: string): boolean => {
  if (isString(p)) {
    p = p.toLowerCase();
    return p.startsWith('https://') || p.startsWith('http://');
  }
  return false;
};
