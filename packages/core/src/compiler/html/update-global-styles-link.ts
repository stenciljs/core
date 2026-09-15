import { join } from '../../utils';

/**
 * Update `<link rel="stylesheet">` hrefs in `doc` for each global style file
 * that was hashed during a production build. `globalStylesMap` maps original
 * filename → hashed filename (e.g. `'app.css'` → `'p-abc123.css'`).
 * `buildDir` should be the URL-relative build directory (e.g. `'/build/'`).
 * @param doc the HTML document to update
 * @param buildDir the URL-relative build directory (e.g. `'/build/'`)
 * @param globalStylesMap map of original → hashed filename for each global style CSS file
 */
export const updateGlobalStylesLinks = (
  doc: Document,
  buildDir: string,
  globalStylesMap: Map<string, string>,
) => {
  if (globalStylesMap.size === 0) {
    return;
  }

  Array.from(doc.querySelectorAll('link')).forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    for (const [original, hashed] of globalStylesMap) {
      if (original === hashed) continue;
      const originalPath = join(buildDir, original);
      const replacer = new RegExp(escapeRegExp(originalPath) + '$');
      const newHref = href.replace(replacer, join(buildDir, hashed));
      if (newHref !== href) {
        link.setAttribute('href', newHref);
        break;
      }
    }
  });
};

const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
