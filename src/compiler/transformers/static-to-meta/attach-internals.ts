import ts from 'typescript';

import type * as d from '../../../declarations';
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

/**
 * Parse custom states configuration from a transformed Stencil component
 *
 * @param staticMembers class members for the Stencil component of interest
 * @returns array of custom state metadata, or empty array if none defined
 */
export const parseAttachInternalsCustomStates = (
  staticMembers: ts.ClassElement[],
): d.ComponentCompilerCustomState[] => {
  const parsedCustomStates = getStaticValue(staticMembers, 'attachInternalsCustomStates');
  if (Array.isArray(parsedCustomStates)) {
    return parsedCustomStates.map((state: { name: string; initialValue: boolean; docs?: string }) => ({
      name: String(state.name),
      initialValue: Boolean(state.initialValue),
      docs: state.docs ?? '',
    }));
  }
  return [];
};
