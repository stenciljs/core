import ts from 'typescript';

import { getStaticValue } from '../transform-utils';

/**
 * Parse the name of the form internals prop from a transformed Stencil
 * component if present
 *
 * @param staticMembers class members for the Stencil component of interest
 * @returns the parsed value, if present, else null
 */
export const parseAttachInternals = (staticMembers: ts.ClassElement[]): string | null => {
  const parsedAttachInternalsMemberName = getStaticValue(staticMembers, 'attachInternalsMemberName');
  if (parsedAttachInternalsMemberName && typeof parsedAttachInternalsMemberName === 'string') {
    return parsedAttachInternalsMemberName;
  } else {
    return null;
  }
};
