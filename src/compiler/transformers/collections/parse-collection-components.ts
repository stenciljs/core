import { join } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { updateModule } from '../static-to-meta/parse-static';

export const parseCollectionComponents = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  collectionDir: string,
  collectionManifest: d.CollectionManifest,
  collection: d.CollectionCompilerMeta,
) => {
  // Load mixin/abstract class entries (classes that can be extended by consuming projects)
  if (collectionManifest.mixins) {
    collectionManifest.mixins.forEach((mixinPath) => {
      const fullPath = join(collectionDir, mixinPath);
      transpileCollectionModule(config, compilerCtx, buildCtx, collection, fullPath);
    });
  }

  // Load component entries
  if (collectionManifest.entries) {
    collectionManifest.entries.forEach((entryPath) => {
      const componentPath = join(collectionDir, entryPath);
      transpileCollectionModule(config, compilerCtx, buildCtx, collection, componentPath);
    });
  }
};

export const transpileCollectionModule = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  collection: d.CollectionCompilerMeta,
  inputFileName: string,
) => {
  const sourceText = compilerCtx.fs.readFileSync(inputFileName);
  const sourceFile = ts.createSourceFile(inputFileName, sourceText, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
  return updateModule(config, compilerCtx, buildCtx, sourceFile, sourceText, inputFileName, undefined, collection);
};
