import ts from 'typescript';
import type * as d from '@stencil/core';

import { normalizePath } from '../../../utils';
import { H } from '../core-runtime-apis';
import { gatherVdomMeta } from './vdom';

/**
 * @param m the module or component to record vdom metadata on
 * @param node the call expression to parse
 * @param typeChecker used to resolve functional components / JSX-returning calls to their source
 * @param moduleFile the module to record those dependencies on; defaults to `m` when it's a module
 */
export const parseCallExpression = (
  m: d.Module | d.ComponentCompilerMeta,
  node: ts.CallExpression,
  typeChecker?: ts.TypeChecker,
  moduleFile: d.Module | undefined = 'functionalComponentDeps' in m ? m : undefined,
) => {
  if (node.arguments != null && node.arguments.length > 0) {
    if (ts.isIdentifier(node.expression)) {
      // h('tag')
      visitCallExpressionArgs(m, node.expression, node.arguments, typeChecker, moduleFile);
    } else if (ts.isPropertyAccessExpression(node.expression)) {
      // document.createElement('tag')
      const n = node.expression.name;
      if (ts.isIdentifier(n) && n) {
        visitCallExpressionArgs(m, n, node.arguments, typeChecker, moduleFile);
      }
    }
  } else if (ts.isPropertyAccessExpression(node.expression)) {
    if (ts.isIdentifier(node.expression.name)) {
      // potential function calls that return jsx e.g. `renderContent()`
      const symbol = typeChecker?.getSymbolAtLocation(node.expression);
      if (!symbol) return;

      const declarations = symbol.getDeclarations();
      if (!declarations || declarations.length === 0) return;

      const declaration = declarations[0];
      const sourceFile = declaration.getSourceFile();
      if (!sourceFile) return;

      addFunctionalComponentDep(moduleFile, sourceFile);
    }
  }
};

const visitCallExpressionArgs = (
  m: d.Module | d.ComponentCompilerMeta,
  callExpressionName: ts.Identifier,
  args: ts.NodeArray<ts.Expression>,
  typeChecker: ts.TypeChecker | undefined,
  moduleFile: d.Module | undefined,
) => {
  const fnName = callExpressionName.escapedText as string;

  if (fnName === 'h' || fnName === H || fnName === 'createElement') {
    visitCallExpressionArg(m, args[0], typeChecker, moduleFile);

    if (fnName === 'h' || fnName === H) {
      gatherVdomMeta(m, args, typeChecker);
    }
  } else if (fnName === 'jsx' || fnName === 'jsxs' || fnName === '_jsx' || fnName === '_jsxs') {
    // Handle jsx-runtime calls (jsx, jsxs)
    // These have the same signature as h() for metadata purposes
    visitCallExpressionArg(m, args[0], typeChecker, moduleFile);
    gatherVdomMeta(m, args, typeChecker);
    // TypeScript's jsx transform passes key as the 3rd argument
    if (args.length > 2 && args[2]) {
      m.hasVdomKey = true;
    }
  } else if (args.length > 1 && fnName === 'createElementNS') {
    visitCallExpressionArg(m, args[1], typeChecker, moduleFile);
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
  typeChecker: ts.TypeChecker | undefined,
  moduleFile: d.Module | undefined,
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
    resolveFunctionalComponentDep(moduleFile, arg, typeChecker);
  }
};

/**
 * Resolves a functional component identifier to its source file and tracks it
 * as a dependency so that build-conditionals can be properly propagated.
 * Follows import / re-export aliases through to the declaring file.
 *
 * @param moduleFile the module to track the dependency on
 * @param identifier the identifier node representing the functional component
 * @param typeChecker the TypeScript type checker for symbol resolution
 */
const resolveFunctionalComponentDep = (
  moduleFile: d.Module | undefined,
  identifier: ts.Identifier,
  typeChecker: ts.TypeChecker,
) => {
  if (!moduleFile) return;
  try {
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol) return;

    const targetSymbol =
      symbol.flags & ts.SymbolFlags.Alias ? typeChecker.getAliasedSymbol(symbol) : symbol;
    const sourceFile = targetSymbol.declarations?.[0]?.getSourceFile();
    if (sourceFile) {
      addFunctionalComponentDep(moduleFile, sourceFile);
    }
  } catch {
    // Symbol resolution can fail in some edge cases - silently ignore
  }
};

const addFunctionalComponentDep = (moduleFile: d.Module | undefined, sourceFile: ts.SourceFile) => {
  const deps = moduleFile?.functionalComponentDeps;
  const sourceFilePath = normalizePath(sourceFile.fileName);
  if (deps && !deps.includes(sourceFilePath)) {
    deps.push(sourceFilePath);
  }
};
