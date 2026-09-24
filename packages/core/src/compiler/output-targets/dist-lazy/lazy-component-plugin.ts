import type * as d from '@stencil/core';
import type { Plugin } from 'rolldown';

import { normalizePath } from '../../../utils';

export const lazyComponentPlugin = (buildCtx: d.BuildCtx): Plugin => {
  // Pre-index entry modules by entryKey for O(1) lookup instead of O(n) find()
  const entryModuleMap = new Map<string, d.EntryModule>(
    buildCtx.entryModules.map((em) => [em.entryKey, em]),
  );

  // Cache generated exports to avoid re-computing on every load
  const exportCache = new Map<string, string>();

  const plugin: Plugin = {
    name: 'lazyComponentPlugin',

    // Use Rolldown's hook filter to only process .entry imports
    // Entry keys are always in format: "component-name.entry" or "comp1.comp2.entry"
    resolveId: {
      filter: { id: /\.entry$/ },
      handler(importee) {
        if (entryModuleMap.has(importee)) {
          return importee;
        }
        return null;
      },
    },

    load(id) {
      const entryModule = entryModuleMap.get(id);
      if (entryModule) {
        let exports = exportCache.get(id);
        if (!exports) {
          exports = entryModule.cmps.map(createComponentExport).join('\n');
          exportCache.set(id, exports);
        }
        return exports;
      }
      return null;
    },
  };

  return plugin;
};

const createComponentExport = (cmp: d.ComponentCompilerMeta): string => {
  const originalClassName = cmp.componentClassName;
  const underscoredClassName = cmp.tagName.replace(/-/g, '_');
  const filePath = normalizePath(cmp.sourceFilePath);
  return `export { ${originalClassName} as ${underscoredClassName} } from '${filePath}';`;
};
