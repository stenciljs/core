import type * as d from '../../declarations';
import { updateTypeIdentifierNames } from './stencil-types';

/**
 * Render the type parameters of a component class for the generated type declarations.
 *
 * Type parameters without a default get `any` as default. This keeps every non-generic
 * reference (e.g. in `HTMLElementTagNameMap` or `IntrinsicElements`) valid and preserves
 * the typing consumers had before the component became generic.
 *
 * @param cmp the metadata for the component
 * @param typeImportData locally/imported/globally used type names, which may be used to prevent naming collisions
 * @returns the type parameter declaration and usage, both empty if the component class is not generic
 */
export const generateTypeParameters = (
  cmp: d.ComponentCompilerMeta,
  typeImportData: d.TypesImportData,
): d.TypeParametersInfo => {
  const typeParameters = cmp.typeParameters ?? [];
  if (typeParameters.length === 0) {
    return { declaration: '', usage: '' };
  }

  const updateNames = (typeParameter: d.ComponentCompilerTypeParameter, type: string) =>
    updateTypeIdentifierNames(typeParameter.references, typeImportData, cmp.sourceFilePath, type);

  const declaration = typeParameters.map((typeParameter) => {
    const constraint = typeParameter.constraint
      ? ` extends ${updateNames(typeParameter, typeParameter.constraint)}`
      : '';
    const defaultType = typeParameter.default ? updateNames(typeParameter, typeParameter.default) : 'any';
    return `${typeParameter.name}${constraint} = ${defaultType}`;
  });

  return {
    declaration: `<${declaration.join(', ')}>`,
    usage: `<${typeParameters.map((typeParameter) => typeParameter.name).join(', ')}>`,
  };
};
