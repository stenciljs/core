import { isOutputTargetDistTypes, join, normalizePath, relative, resolve } from '@utils';
import { dirname } from 'path';

import type * as d from '../../declarations';
import { FsWriteResults } from '../sys/in-memory-fs';

/**
 * Update a type declaration file's import declarations using the module `@stencil/core`
 * @param typesDir the directory where type declaration files are expected to exist
 * @param dtsFilePath the path of the type declaration file being updated, used to derive the correct import declaration
 * module
 * @param dtsContent the content of a type declaration file to update
 * @returns the updated type declaration file contents
 */
export const updateStencilTypesImports = (typesDir: string, dtsFilePath: string, dtsContent: string): string => {
  const dir = dirname(dtsFilePath);
  // determine the relative path between the directory of the .d.ts file and the types directory. this value may result
  // in '.' if they are the same
  const relPath = relative(dir, typesDir);

  let coreDtsPath = join(relPath, CORE_FILENAME);
  if (!coreDtsPath.startsWith('.')) {
    coreDtsPath = `./${coreDtsPath}`;
  }

  coreDtsPath = normalizePath(coreDtsPath);
  if (dtsContent.includes('@stencil/core')) {
    dtsContent = dtsContent.replace(/(from\s*(:?'|"))@stencil\/core\/internal('|")/g, `$1${coreDtsPath}$2`);
    dtsContent = dtsContent.replace(/(from\s*(:?'|"))@stencil\/core('|")/g, `$1${coreDtsPath}$2`);
  }
  return dtsContent;
};

/**
 * Utility for ensuring that naming collisions do not appear in type declaration files for a component's class members
 * decorated with @Prop, @Event, and @Method
 * @param typeReferences all type names used by a component class member
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @param sourceFilePath the path to the source file of a component using the type being inspected
 * @param initialType the name of the type that may be updated
 * @returns the updated type name, which may be the same as the initial type name provided as an argument to this
 * function
 */
export const updateTypeIdentifierNames = (
  typeReferences: d.ComponentCompilerTypeReferences,
  typeImportData: d.TypesImportData,
  sourceFilePath: string,
  initialType: string,
): string => {
  let currentTypeName = initialType;

  // iterate over each of the type references, as there may be >1 reference to inspect
  for (const typeReference of Object.values(typeReferences)) {
    const importResolvedFile = getTypeImportPath(typeReference.path, sourceFilePath);

    if (typeof importResolvedFile !== 'string') {
      continue;
    }

    if (!typeImportData.hasOwnProperty(importResolvedFile)) {
      continue;
    }

    for (const typesImportDatumElement of typeImportData[importResolvedFile]) {
      currentTypeName = updateTypeName(currentTypeName, typesImportDatumElement);
    }
  }
  return currentTypeName;
};

/**
 * Determine the path of a given type reference, relative to the path of a source file
 * @param importResolvedFile the path to the file containing the resolve type. may be absolute or relative
 * @param sourceFilePath the component source file path to resolve against
 * @returns the path of the type import
 */
const getTypeImportPath = (importResolvedFile: string | undefined, sourceFilePath: string): string | undefined => {
  if (importResolvedFile && importResolvedFile.startsWith('.')) {
    // the path to the type reference is relative, resolve it relative to the provided source path
    importResolvedFile = resolve(dirname(sourceFilePath), importResolvedFile);
  }

  return importResolvedFile;
};

/**
 * Determine whether the string representation of a type should be replaced with an alias
 * @param currentTypeName the current string representation of a type
 * @param typeAlias a type member and a potential different name associated with the type member
 * @returns the updated string representation of a type. If the type is not updated, the original type name is returned
 */
const updateTypeName = (currentTypeName: string, typeAlias: d.TypesMemberNameData): string => {
  if (!typeAlias.importName) {
    return currentTypeName;
  }

  // TODO(STENCIL-419): Update this functionality to no longer use a regex
  // negative lookahead specifying that quotes that designate a string in JavaScript cannot follow some expression
  const endingStrChar = '(?!("|\'|`))';
  /**
   * A regular expression that looks at type names along a [word boundary](https://www.regular-expressions.info/wordboundaries.html).
   * This is used as the best approximation for replacing type collisions, as this stage of compilation has only
   * 'flattened' type information in the form of a String.
   *
   * This regex should be expected to capture types that are found in generics, unions, intersections, etc., but not
   * those in string literals. We do not check for a starting quote (" | ' | `) here as some browsers do not support
   * negative lookbehind. This works "well enough" until STENCIL-419 is completed.
   */
  const typeNameRegex = new RegExp(`\\b${typeAlias.localName}\\b${endingStrChar}`, 'g');
  return currentTypeName.replace(typeNameRegex, typeAlias.importName);
};

/**
 * Writes Stencil core typings file to disk for a dist-* output target
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @returns the results of writing one or more type declaration files to disk
 */
export const copyStencilCoreDts = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
): Promise<ReadonlyArray<FsWriteResults>> => {
  const typesOutputTargets = config.outputTargets.filter(isOutputTargetDistTypes).filter((o) => o.typesDir);

  const srcStencilDtsPath = join(config.sys.getCompilerExecutingPath(), '..', '..', 'internal', CORE_DTS);
  const srcStencilCoreDts = await compilerCtx.fs.readFile(srcStencilDtsPath);

  return Promise.all(
    typesOutputTargets.map((o) => {
      const coreDtsFilePath = join(o.typesDir, CORE_DTS);
      return compilerCtx.fs.writeFile(coreDtsFilePath, srcStencilCoreDts, { outputTargetType: o.type });
    }),
  );
};

const CORE_FILENAME = `stencil-public-runtime`;
const CORE_DTS = `${CORE_FILENAME}.d.ts`;
