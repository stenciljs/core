import { dashToPascalCase, sortBy, toTitleCase } from '@utils';

import type * as d from '../../../declarations';

export const updateToHydrateComponents = async (cmps: d.ComponentCompilerMeta[]) => {
  const hydrateCmps = await Promise.all(cmps.map(updateToHydrateComponent));
  return sortBy(hydrateCmps, (c) => c.cmp.componentClassName);
};

const updateToHydrateComponent = async (cmp: d.ComponentCompilerMeta) => {
  const cmpData: d.ComponentCompilerData = {
    filePath: cmp.sourceFilePath,
    exportLine: ``,
    cmp: cmp,
    uniqueComponentClassName: ``,
    importLine: ``,
  };

  const pascalCasedClassName = dashToPascalCase(toTitleCase(cmp.tagName));

  if (cmp.componentClassName !== pascalCasedClassName) {
    cmpData.uniqueComponentClassName = pascalCasedClassName;
    cmpData.importLine = `import { ${cmp.componentClassName} as ${cmpData.uniqueComponentClassName} } from '${cmpData.filePath}';`;
  } else {
    cmpData.uniqueComponentClassName = cmp.componentClassName;
    cmpData.importLine = `import { ${cmpData.uniqueComponentClassName} } from '${cmpData.filePath}';`;
  }

  return cmpData;
};
