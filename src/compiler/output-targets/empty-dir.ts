import {
  isOutputTargetDist,
  isOutputTargetDistCustomElements,
  isOutputTargetDistLazy,
  isOutputTargetDistLazyLoader,
  isOutputTargetHydrate,
  isOutputTargetWww,
  isString,
} from '@utils';

import type * as d from '../../declarations';

type OutputTargetEmptiable =
  | d.OutputTargetDist
  | d.OutputTargetWww
  | d.OutputTargetDistLazyLoader
  | d.OutputTargetHydrate;

const isEmptable = (o: d.OutputTarget): o is OutputTargetEmptiable =>
  isOutputTargetDist(o) ||
  isOutputTargetDistCustomElements(o) ||
  isOutputTargetWww(o) ||
  isOutputTargetDistLazy(o) ||
  isOutputTargetDistLazyLoader(o) ||
  isOutputTargetHydrate(o);

export const emptyOutputTargets = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (buildCtx.isRebuild) {
    return;
  }
  const cleanDirs = config.outputTargets
    .filter(isEmptable)
    .filter((o) => o.empty === true)
    .map((o) => o.dir || (o as any).esmDir)
    .filter(isString);

  if (cleanDirs.length === 0) {
    return;
  }

  const timeSpan = buildCtx.createTimeSpan(`cleaning ${cleanDirs.length} dirs`, true);
  await compilerCtx.fs.emptyDirs(cleanDirs);

  timeSpan.finish('cleaning dirs finished');
};
