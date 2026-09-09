import type * as d from '@stencil/core';

import {
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetDistLazy,
  isOutputTargetSsr,
  isOutputTargetWww,
  isString,
} from '../../utils';

type OutputTargetEmptiable = d.OutputTargetLoaderBundle | d.OutputTargetWww | d.OutputTargetSsr;

const isEmptable = (o: d.OutputTarget): o is OutputTargetEmptiable =>
  isOutputTargetLoaderBundle(o) ||
  isOutputTargetStandalone(o) ||
  isOutputTargetWww(o) ||
  isOutputTargetDistLazy(o) ||
  isOutputTargetSsr(o);

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
