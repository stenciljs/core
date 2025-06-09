import { addDocBlock, GENERATED_DTS, getComponentsDtsSrcFilePath, normalizePath, relative, resolve } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../declarations';
import { generateComponentTypes } from './generate-component-types';
import { generateEventDetailTypes } from './generate-event-detail-types';
import { updateStencilTypesImports } from './stencil-types';
import { COMPONENTS_DTS_HEADER, sortImportNames } from './types-utils';
import { updateReferenceTypeImports } from './update-import-refs';

/**
 * Generates and writes a `components.d.ts` file to disk. This file may be written to the `src` directory of a project,
 * or be written to a directory that is meant to be distributed (e.g. the output directory of `dist-custom-elements`).
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param destination the relative directory in the filesystem to write the type declaration file to
 * @returns `true` if the type declaration file written to disk has changed, `false` otherwise
 */
export const generateAppTypes = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  destination: string,
): Promise<boolean> => {
  // only gather components that are still root ts files we've found and have component metadata
  // the compilerCtx cache may still have files that may have been deleted/renamed
  const timespan = buildCtx.createTimeSpan(`generated app types started`, true);
  const areTypesInternal = destination === 'src';

  // Generate d.ts files for component types
  let componentTypesFileContent = generateComponentTypesFile(config, buildCtx, areTypesInternal);

  // immediately write the components.d.ts file to disk and put it into fs memory
  let componentsDtsFilePath = getComponentsDtsSrcFilePath(config);

  if (!areTypesInternal) {
    componentsDtsFilePath = resolve(destination, GENERATED_DTS);
    componentTypesFileContent = updateStencilTypesImports(
      destination,
      componentsDtsFilePath,
      componentTypesFileContent,
    );
  }

  const writeResults = await compilerCtx.fs.writeFile(normalizePath(componentsDtsFilePath), componentTypesFileContent, {
    immediateWrite: true,
  });
  const hasComponentsDtsChanged = writeResults.changedContent;

  const componentsDtsRelFileName = relative(config.rootDir, componentsDtsFilePath);
  if (hasComponentsDtsChanged) {
    config.logger.debug(`generateAppTypes: ${componentsDtsRelFileName} has changed`);
  }

  timespan.finish(`generated app types finished: ${componentsDtsRelFileName}`);
  return hasComponentsDtsChanged;
};

/**
 * Generates a `components.d.ts` file's contents, which contains the typings for all components in a Stencil project
 * @param config the Stencil configuration associated with the project being compiled
 * @param buildCtx the context associated with the current build
 * @param areTypesInternal determines if non-exported type definitions are being generated or not
 * @returns the contents of the `components.d.ts` file
 */
const generateComponentTypesFile = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  areTypesInternal: boolean,
): string => {
  let typeImportData: d.TypesImportData = {};
  const c: string[] = [];
  const allTypes = new Map<string, number>();
  const components = buildCtx.components.filter((m) => !m.isCollectionDependency);
  const componentEventDetailTypes: d.TypesModule[] = [];

  const modules: d.TypesModule[] = components.map((cmp) => {
    /**
     * Generate a key-value store that uses the path to the file where an import is defined as the key, and an object
     * containing the import's original name and any 'new' name we give it to avoid collisions. We're generating this
     * data structure for each Stencil component in series, therefore the memory footprint of this entity will likely
     * grow as more components (with additional types) are processed.
     */
    typeImportData = updateReferenceTypeImports(typeImportData, allTypes, cmp, cmp.sourceFilePath, config);
    if (cmp.events.length > 0) {
      /**
       * Only generate event detail types for components that have events.
       */
      componentEventDetailTypes.push(generateEventDetailTypes(cmp));
    }
    return generateComponentTypes(cmp, typeImportData, areTypesInternal);
  });

  c.push(COMPONENTS_DTS_HEADER);
  c.push(`import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";`);

  // Map event type metadata to partial expressions (omitting import/export keywords)
  // e.g. { TestEvent } from '../path/to/event/test-event.interface';
  const expressions = Object.keys(typeImportData).map((filePath) => {
    const typeData = typeImportData[filePath];

    let importFilePath = filePath;
    if (isAbsolute(filePath)) {
      importFilePath = normalizePath('./' + relative(config.srcDir, filePath)).replace(/\.(tsx|ts)$/, '');
    }

    return `{ ${typeData
      .sort(sortImportNames)
      .map((td) => {
        if (td.originalName === '') {
          return `${td.localName}`;
        } else if (td.originalName === td.importName) {
          return `${td.originalName}`;
        } else {
          return `${td.originalName} as ${td.importName}`;
        }
      })
      .join(`, `)} } from "${importFilePath}";`;
  });

  // Write all import and export statements for event types
  c.push(...expressions.map((ref) => `import ${ref}`), ...expressions.map((ref) => `export ${ref}`));

  c.push(`export namespace Components {`);
  c.push(...modules.map((m) => `${m.component}`));
  c.push(`}`);

  c.push(...componentEventDetailTypes.map((m) => `${m.component}`));

  c.push(`declare global {`);

  c.push(...modules.map((m) => m.element));

  c.push(`    interface HTMLElementTagNameMap {`);
  c.push(...modules.map((m) => `        "${m.tagName}": ${m.htmlElementName};`));
  c.push(`    }`);

  c.push(`}`);

  c.push(`declare namespace LocalJSX {`);
  c.push(
    ...modules.map((m) => {
      const docs = components.find((c) => c.tagName === m.tagName).docs;
      return addDocBlock(m.jsx, docs, 4);
    }),
  );

  c.push(`    interface IntrinsicElements {`);
  c.push(...modules.map((m) => `        "${m.tagName}": ${m.tagNameAsPascal};`));
  c.push(`    }`);

  c.push(`}`);

  c.push(`export { LocalJSX as JSX };`);

  c.push(`declare module "@stencil/core" {`);
  c.push(`    export namespace JSX {`);
  c.push(`        interface IntrinsicElements {`);
  c.push(
    ...modules.map((m) => {
      const docs = components.find((c) => c.tagName === m.tagName).docs;

      return addDocBlock(
        `            "${m.tagName}": LocalJSX.${m.tagNameAsPascal} & JSXBase.HTMLAttributes<${m.htmlElementName}>;`,
        docs,
        12,
      );
    }),
  );
  c.push(`        }`);
  c.push(`    }`);
  c.push(`}`);

  return c.join(`\n`) + `\n`;
};
