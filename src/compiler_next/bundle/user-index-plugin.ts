import * as d from '../../declarations';
import { Plugin } from 'rollup';
import { USER_INDEX_ENTRY_ID } from './entry-alias-ids';
import path from 'path';


export const userIndexPlugin = (config: d.Config, compilerCtx: d.CompilerCtx): Plugin => {
  return {
    name: 'userIndexPlugin',

    resolveId(importee) {
      if (importee === USER_INDEX_ENTRY_ID) {
        return importee;
      }
      return null;
    },

    async load(id) {
      if (id === USER_INDEX_ENTRY_ID) {
        const usersIndexJsPath = path.join(config.srcDir, 'index.js');
        const userIndexContent = await compilerCtx.fs.readFile(usersIndexJsPath);
        if (typeof userIndexContent === 'string') {
          return userIndexContent;

        } else {
          // We can use the loader rollup plugin to inject content to the "index" chunk
          return `//! Autogenerated index`;
        }
      }
      return null;
    }
  };
};


