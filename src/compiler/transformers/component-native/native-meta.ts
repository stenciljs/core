import ts from 'typescript';

import type * as d from '../../../declarations';
import { convertValueToLiteral, createStaticGetter } from '../transform-utils';

export const addNativeComponentMeta = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta) => {
  classMembers.push(createStaticGetter('is', convertValueToLiteral(cmp.tagName)));
};
