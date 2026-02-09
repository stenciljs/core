import { normalizePath } from '../../../utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { H } from '../core-runtime-apis';
import { gatherVdomMeta } from './vdom';

export const parseCallExpression = (
  m: d.Module | d.ComponentCompilerMeta,
  node: ts.CallExpression,
  typeChecker?: ts.TypeChecker,
) => {
  if (node.arguments != null && node.arguments.length > 0) {
    if (ts.isIdentifier(node.expression)) {
      // h('tag')
      visitCallExpressionArgs(m, node.expression, node.arguments, typeChecker);
    } else if (ts.isPropertyAccessExpression(node.expression)) {
      // document.createElement('tag')
      const n = node.expression.name;
      if (ts.isIdentifier(n) && n) {
        visitCallExpressionArgs(m, n, node.arguments, typeChecker);
      }
    }
  }
};

const visitCallExpressionArgs = (
  m: d.Module | d.ComponentCompilerMeta,
  callExpressionName: ts.Identifier,
  args: ts.NodeArray<ts.Expression>,
  typeChecker?: ts.TypeChecker,
) => {
  const fnName = callExpressionName.escapedText as string;

  if (fnName === 'h' || fnName === H || fnName === 'createElement') {
    visitCallExpressionArg(m, args[0], typeChecker);

    if (fnName === 'h' || fnName === H) {
      gatherVdomMeta(m, args);
    }
  } else if (
    fnName === 'jsx' ||
    fnName === 'jsxs' ||
    fnName === 'jsxDEV' ||
    fnName === '_jsx' ||
    fnName === '_jsxs' ||
    fnName === '_jsxDEV'
  ) {
    // Handle jsx-runtime calls (jsx, jsxs, jsxDEV)
    // These have the same signature as h() for metadata purposes
    visitCallExpressionArg(m, args[0], typeChecker);
    gatherVdomMeta(m, args);
    // TypeScript's jsx transform passes key as the 3rd argument
    if (args.length > 2 && args[2]) {
      m.hasVdomKey = true;
    }
  } else if (args.length > 1 && fnName === 'createElementNS') {
    visitCallExpressionArg(m, args[1], typeChecker);
  } else if (fnName === 'require' && args.length > 0 && (m as d.Module).originalImports) {
    const arg = args[0];
    if (ts.isStringLiteral(arg)) {
      if (!(m as d.Module).originalImports.includes(arg.text)) {
        (m as d.Module).originalImports.push(arg.text);
      }
    }
  }
};

const visitCallExpressionArg = (
  m: d.Module | d.ComponentCompilerMeta,
  arg: ts.Expression,
  typeChecker?: ts.TypeChecker,
) => {
  if (ts.isStringLiteral(arg)) {
    let tag = arg.text;

    if (typeof tag === 'string') {
      tag = tag.toLowerCase();
      m.htmlTagNames.push(tag);

      if (tag.includes('-')) {
        m.potentialCmpRefs.push(tag);
      }
    }
  } else if (typeChecker && ts.isIdentifier(arg)) {
    // Handle functional component references like <MyIcon /> which compiles to h(MyIcon, ...)
    // Use typeChecker to resolve the identifier to its source file
    resolveFunctionalComponentDep(m, arg, typeChecker);
  }
};

/**
 * Resolves a functional component identifier to its source file and tracks it
 * as a dependency so that build-conditionals can be properly propagated.
 *
 * @param m the module or component metadata to track the dependency on
 * @param identifier the identifier node representing the functional component
 * @param typeChecker the TypeScript type checker for symbol resolution
 */
const resolveFunctionalComponentDep = (
  m: d.Module | d.ComponentCompilerMeta,
  identifier: ts.Identifier,
  typeChecker: ts.TypeChecker,
) => {
  try {
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol) return;

    // Follow aliases (imports) to get the actual symbol
    const aliasedSymbol = typeChecker.getAliasedSymbol(symbol);
    const targetSymbol = aliasedSymbol || symbol;

    // Get the declaration to find the source file
    const declarations = targetSymbol.declarations;
    if (!declarations || declarations.length === 0) return;

    const declaration = declarations[0];
    const sourceFile = declaration.getSourceFile();
    if (!sourceFile) return;

    const sourceFilePath = normalizePath(sourceFile.fileName);

    // Track this as a functional component dependency
    // We store it on the module (not component) since that's where localImports lives
    const moduleFile = m as d.Module;
    if (moduleFile.functionalComponentDeps) {
      if (!moduleFile.functionalComponentDeps.includes(sourceFilePath)) {
        moduleFile.functionalComponentDeps.push(sourceFilePath);
      }
    }
  } catch (_e) {
    // Symbol resolution can fail in some edge cases - silently ignore
  }
};
