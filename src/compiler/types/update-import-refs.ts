import { resolve } from '@utils';
import { dirname } from 'path';
import ts from 'typescript';

import type * as d from '../../declarations';

/**
 * Find all referenced types by a component and add them to the `importDataObj` parameter
 * @param importDataObj an output parameter that contains the imported types seen thus far by the compiler
 * @param typeCounts a map of seen types and the number of times the type has been seen
 * @param cmp the metadata associated with the component whose types are being inspected
 * @param filePath the path of the component file
 * @param config The Stencil config for the project
 * @returns the updated import data
 */
export const updateReferenceTypeImports = (
  importDataObj: d.TypesImportData,
  typeCounts: Map<string, number>,
  cmp: d.ComponentCompilerMeta,
  filePath: string,
  config: d.ValidatedConfig,
): d.TypesImportData => {
  const updateImportReferences = updateImportReferenceFactory(typeCounts, filePath, config);

  return [...cmp.properties, ...cmp.events, ...cmp.methods]
    .filter(
      (cmpProp: d.ComponentCompilerProperty | d.ComponentCompilerEvent | d.ComponentCompilerMethod) =>
        cmpProp.complexType && cmpProp.complexType.references,
    )
    .reduce((typesImportData: d.TypesImportData, cmpProp) => {
      return updateImportReferences(typesImportData, cmpProp.complexType.references);
    }, importDataObj);
};

/**
 * Describes a function that updates type import references for a file
 * @param existingTypeImportData locally/imported/globally used type names. This data structure keeps track of the name
 * of the type that is used in a file, and an alias that Stencil may have generated for the name to avoid collisions.
 * @param typesReferences type references from a single file
 * @returns updated type import data
 */
type ImportReferenceUpdater = (
  existingTypeImportData: d.TypesImportData,
  typeReferences: { [key: string]: d.ComponentCompilerTypeReference },
) => d.TypesImportData;

/**
 * Factory function to create an `ImportReferenceUpdater` instance
 * @param typeCounts a key-value store of seen type names and the number of times the type name has been seen
 * @param filePath the path of the file containing the component whose imports are being inspected
 * @param config The Stencil config for the project
 * @returns an `ImportReferenceUpdater` instance for updating import references in the provided `filePath`
 */
const updateImportReferenceFactory = (
  typeCounts: Map<string, number>,
  filePath: string,
  config: d.ValidatedConfig,
): ImportReferenceUpdater => {
  /**
   * Determines the number of times that a type identifier (name) has been used. If an identifier has been used before,
   * append the number of times the identifier has been seen to its name to avoid future naming collisions
   * @param name the identifier name to check for previous usages
   * @returns the identifier name, potentially with an integer appended to its name if it has been seen before.
   */
  function getIncrementTypeName(name: string): string {
    const counter = typeCounts.get(name);
    if (counter === undefined) {
      typeCounts.set(name, 1);
      return name;
    }
    typeCounts.set(name, counter + 1);
    return `${name}${counter}`;
  }

  return (
    existingTypeImportData: d.TypesImportData,
    typeReferences: { [key: string]: d.ComponentCompilerTypeReference },
  ): d.TypesImportData => {
    Object.keys(typeReferences)
      .map<[string, d.ComponentCompilerTypeReference]>((typeName) => {
        return [typeName, typeReferences[typeName]];
      })
      .forEach(([typeName, typeReference]) => {
        let importResolvedFile: string;

        // If global then there is no import statement needed
        if (typeReference.location === 'global') {
          return;

          // If local then import location is the current file
        } else if (typeReference.location === 'local') {
          importResolvedFile = filePath;
        } else {
          importResolvedFile = typeReference.path!;

          // We only care to resolve any _potential_ aliased
          // modules if we're not already certain the path isn't an alias.
          // We also don't want to transform aliases unless the user has enabled the behavior
          // in their Stencil config
          if (config.transformAliasedImportPaths && !importResolvedFile.startsWith('.')) {
            const { resolvedModule } = ts.resolveModuleName(
              typeReference.path!,
              filePath,
              config.tsCompilerOptions,
              ts.createCompilerHost(config.tsCompilerOptions),
            );

            if (resolvedModule && !resolvedModule.isExternalLibraryImport && resolvedModule.resolvedFileName) {
              importResolvedFile = resolvedModule.resolvedFileName;
            }
          }
        }

        // If this is a relative path make it absolute
        if (importResolvedFile.startsWith('.')) {
          importResolvedFile = resolve(dirname(filePath), importResolvedFile);
        }
        existingTypeImportData[importResolvedFile] = existingTypeImportData[importResolvedFile] || [];

        // If this file already has a reference to this type move on
        if (existingTypeImportData[importResolvedFile].find((df) => df.localName === typeName)) {
          return;
        }

        const newTypeName = getIncrementTypeName(typeName);
        existingTypeImportData[importResolvedFile].push({
          // Since we create a unique ID for each type for documentation generation purposes, we can parse
          // that ID to get the original name for the export
          originalName: typeReference.id.split('::').pop(),
          localName: typeName,
          importName: newTypeName,
        });
      });

    return existingTypeImportData;
  };
};
