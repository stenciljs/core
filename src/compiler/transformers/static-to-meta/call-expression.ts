import ts from 'typescript';

import type * as d from '../../../declarations';
import { H } from '../core-runtime-apis';
import { gatherVdomMeta } from './vdom';

export const parseCallExpression = (m: d.Module | d.ComponentCompilerMeta, node: ts.CallExpression) => {
  if (node.arguments != null && node.arguments.length > 0) {
    if (ts.isIdentifier(node.expression)) {
      // h('tag')
      visitCallExpressionArgs(m, node.expression, node.arguments);
    } else if (ts.isPropertyAccessExpression(node.expression)) {
      // document.createElement('tag')
      const n = node.expression.name;
      if (ts.isIdentifier(n) && n) {
        visitCallExpressionArgs(m, n, node.arguments);
      }
    }
  }
};

const visitCallExpressionArgs = (
  m: d.Module | d.ComponentCompilerMeta,
  callExpressionName: ts.Identifier,
  args: ts.NodeArray<ts.Expression>,
) => {
  const fnName = callExpressionName.escapedText as string;

  if (fnName === 'h' || fnName === H || fnName === 'createElement') {
    visitCallExpressionArg(m, args[0]);

    if (fnName === 'h' || fnName === H) {
      gatherVdomMeta(m, args);
    }
  } else if (args.length > 1 && fnName === 'createElementNS') {
    visitCallExpressionArg(m, args[1]);
  } else if (fnName === 'require' && args.length > 0 && (m as d.Module).originalImports) {
    const arg = args[0];
    if (ts.isStringLiteral(arg)) {
      if (!(m as d.Module).originalImports.includes(arg.text)) {
        (m as d.Module).originalImports.push(arg.text);
      }
    }
  }
};

const visitCallExpressionArg = (m: d.Module | d.ComponentCompilerMeta, arg: ts.Expression) => {
  if (ts.isStringLiteral(arg)) {
    let tag = arg.text;

    if (typeof tag === 'string') {
      tag = tag.toLowerCase();
      m.htmlTagNames.push(tag);

      if (tag.includes('-')) {
        m.potentialCmpRefs.push(tag);
      }
    }
  }
};
