import type * as d from '@stencil/core';
import type { Plugin } from 'rollup';

import { normalizePath } from '../../../utils';

export const lazyComponentPlugin = (buildCtx: d.BuildCtx): Plugin => {
  const entrys = new Map<string, d.EntryModule>();

  const plugin: Plugin = {
    name: 'lazyComponentPlugin',

    resolveId(importee) {
      const entryModule = buildCtx.entryModules.find((em) => em.entryKey === importee);
      if (entryModule) {
        entrys.set(importee, entryModule);
        return importee;
      }

      return null;
    },

    load(id) {
      const entryModule = entrys.get(id);
      if (entryModule) {
        return entryModule.cmps.map(createComponentExport).join('\n');
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
