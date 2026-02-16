import { DEFAULT_STYLE_MODE } from '@utils';

/**
 * Get a unique component ID which incorporates the component tag name and
 * (optionally) a style mode
 *
 * e.g. for the tagName `'my-component'` and the mode `'ios'` this would be
 * `'sc-my-component-ios'`.
 *
 * @param tagName the tag name for the component of interest
 * @param mode an optional mode
 * @returns a scope ID
 */
export const getScopeId = (tagName: string, mode?: string) => {
  return 'sc-' + tagName + (mode && mode !== DEFAULT_STYLE_MODE ? '-' + mode : '');
};
