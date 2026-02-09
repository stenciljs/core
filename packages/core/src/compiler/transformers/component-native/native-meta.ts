import ts from 'typescript';

import type * as d from '@stencil/core';
import { convertValueToLiteral, createStaticGetter } from '../transform-utils';

export const addNativeComponentMeta = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta) => {
  classMembers.push(createStaticGetter('is', convertValueToLiteral(cmp.tagName)));
};
