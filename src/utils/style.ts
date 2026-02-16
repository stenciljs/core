import { supportsConstructableStylesheets } from '@platform';

/**
 * If (1) styles is not empty string, and (2) constructable stylesheets are supported,
 * then make a stylesheet.
 *
 * @param styles - The styles to add to the stylesheet. If empty string, then no stylesheet is returned.
 * @returns A stylesheet if it can be created, otherwise undefined.
 */
export function createStyleSheetIfNeededAndSupported(styles: string): CSSStyleSheet | undefined {
  if (!styles || !supportsConstructableStylesheets) return undefined;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  return sheet;
}
