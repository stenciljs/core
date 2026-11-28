import type * as d from '@stencil/core';

import { dashToPascalCase, sortBy, toTitleCase } from '../../../utils';

/**
 * Updates the component metadata to be used for generating the SSR factory.
 * - Updates the component class name to be in PascalCase
 * - Creates an import line for the component.
 * @param cmps The array of component metadata to update.
 * @returns The updated component metadata array.
 */
export const updateSsrComponents = async (cmps: d.ComponentCompilerMeta[]) => {
  const ssrCmps = await Promise.all(cmps.map(updateSsrComponent));
  return sortBy(ssrCmps, (c) => c.cmp.componentClassName);
};

const updateSsrComponent = async (cmp: d.ComponentCompilerMeta) => {
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
