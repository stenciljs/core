import type { LoadResult, Plugin, ResolveIdResult } from 'rolldown';

// Escape special regex characters in a string
const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Rolldown plugin that aids in resolving the entry points (1 or more files) for a Stencil project. For example, a project
 * using the `standalone` output target may have a single 'entry point' for each file containing a component.
 * Each of those files will be independently resolved and loaded by this plugin for further processing by Rolldown later
 * in the bundling process.
 *
 * @param entries the Stencil project files to process. It should be noted that the keys in this object may not
 * necessarily be an absolute or relative path to a file, but may be a Rolldown Virtual Module (which begin with \0).
 * @returns the rolldown plugin that loads and process a Stencil project's entry points
 */
export const loaderPlugin = (entries: { [id: string]: string } = {}): Plugin => {
  const entryKeys = Object.keys(entries);

  const entryFilter =
    entryKeys.length > 0 ? new RegExp(`^(${entryKeys.map(escapeRegex).join('|')})$`) : /^$/;

  return {
    name: 'stencilLoaderPlugin',
    /**
     * A rolldown build hook for resolving the imports of individual Stencil project files. This hook only resolves
     * modules that are contained in the plugin's `entries` argument. [Source](https://rolldownjs.org/guide/en/#resolveid)
     * @param id the importee to resolve
     * @returns a string that resolves an import to some id, null otherwise
     */
    resolveId: {
      filter: { id: entryFilter },
      handler(id: string): ResolveIdResult {
        if (id in entries) {
          return { id };
        }
        return null;
      },
    },
    /**
     * A rolldown build hook for loading individual Stencil project files [Source](https://rolldownjs.org/guide/en/#load)
     * @param id the path of the module to load. It should be noted that the keys in this object may not necessarily
     * be an absolute or relative path to a file, but may be a Rolldown Virtual Module.
     * @returns the module matched, null otherwise
     */
    load: {
      filter: { id: entryFilter },
      handler(id: string): LoadResult {
        if (id in entries) {
          return entries[id];
        }
        return null;
      },
    },
  };
};
