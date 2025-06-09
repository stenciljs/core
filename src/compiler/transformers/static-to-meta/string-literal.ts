import ts from 'typescript';

import type * as d from '../../../declarations';

export const parseStringLiteral = (m: d.Module | d.ComponentCompilerMeta, node: ts.StringLiteral) => {
  if (typeof node.text === 'string' && node.text.includes('</')) {
    if (node.text.includes('<slot')) {
      m.htmlTagNames.push('slot');
    }
    if (node.text.includes('<svg')) {
      m.htmlTagNames.push('svg');
    }
  }
};
