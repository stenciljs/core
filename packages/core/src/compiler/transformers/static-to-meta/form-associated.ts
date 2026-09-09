import ts from 'typescript';

import { getStaticValue } from '../transform-utils';

/**
 * Parse whether a transformed Stencil component is form-associated
 *
 * @param staticMembers class members for the Stencil component of interest
 * @returns whether or not the given component is form-associated
 */
export const parseFormAssociated = (staticMembers: ts.ClassElement[]): boolean => {
  const isFormAssociated = getStaticValue(staticMembers, 'formAssociated');
  return typeof isFormAssociated === 'boolean' && isFormAssociated;
};
