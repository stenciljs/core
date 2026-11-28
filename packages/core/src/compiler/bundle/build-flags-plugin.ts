import ts from 'typescript';
import type * as d from '@stencil/core';
import type { Plugin } from 'rolldown';

import { CLIENT_BUILD_FLAGS, SERVER_BUILD_FLAGS } from '../../runtime/runtime-constants';
import type { BundleOptions } from './bundle-interface';

const STENCIL_CORE_IMPORT_RE =
  /^@stencil\/core(?:\/runtime(?:\/(?:client(?:\/(?:standalone|lazy))?|server))?)?$/;
// cheap pre-filter, before paying for a parse
const BUILD_IMPORT_RE = /\bimport\s*\{[^}]*\bBuild\b[^}]*\}\s*from\s*['"]@stencil\/core/;

/**
 * Rolldown plugin that folds user-code `Build.<flag>` reads to literals (see {@link foldBuildFlags}),
 * so rolldown can tree-shake gated branches - and anything only they import - before chunking.
 *
 * Only flags whose value is fixed for this bundle are folded. With an external runtime,
 * `isDev` / `isTesting` come from the consumer's app-data, so they're left as runtime reads.
 *
 * @param bundleOpts the options for this bundle
 * @returns a rolldown plugin
 */
export const buildFlagsPlugin = (bundleOpts: BundleOptions): Plugin => {
  const flags = getFoldableBuildFlags(bundleOpts);
  return {
    name: 'stencil-build-flags',
    transform: {
      filter: { code: BUILD_IMPORT_RE },
      handler(code, id) {
        if (id.startsWith('\0')) {
          return null;
        }
        const folded = foldBuildFlags(code, id.split('?')[0], flags);
        // same-length replacement, so the incoming sourcemap is still valid
        return folded === null ? null : { code: folded, map: null };
      },
    },
  };
};

/**
 * The `Build` flags with a fixed value in this bundle.
 *
 * @param bundleOpts the options for this bundle
 * @returns the foldable flags
 */
export const getFoldableBuildFlags = (
  bundleOpts: BundleOptions,
): Partial<d.UserBuildConditionals> => {
  if (bundleOpts.platform === 'ssr') {
    return { ...SERVER_BUILD_FLAGS };
  }
  // client `isDev` / `isTesting` are `BUILD.*`, which appDataPlugin builds from these conditionals
  const flags: Partial<d.UserBuildConditionals> = { ...CLIENT_BUILD_FLAGS };
  const conditionals = bundleOpts.conditionals;
  if (bundleOpts.platform === 'client' && !bundleOpts.externalRuntime && conditionals) {
    if (typeof conditionals.isDev === 'boolean') flags.isDev = conditionals.isDev;
    if (typeof conditionals.isTesting === 'boolean') flags.isTesting = conditionals.isTesting;
  }
  return flags;
};

/**
 * Replaces `Build.<flag>` reads (where `Build` is imported from `@stencil/core`) with literals,
 * letting bundlers / minify-ers drop dead branches. Neither oxc nor terser can fold a property
 * read on the runtime's `Build` object.
 *
 * e.g. with `{ isServer: false }`:
 * ```ts
 * if (Build.isServer) { … }  // before
 * if (false         ) { … }  // after
 * ```
 *
 * Replacements are padded to the original length (newlines kept), so an existing sourcemap
 * for `code` stays valid. A `Build` binding that is shadowed or written to in the module is left alone.
 *
 * @param code JS or TS source
 * @param fileName used to pick the parser's script kind
 * @param flags the flag values to fold; flags not present are left as runtime reads
 * @returns the folded code, or `null` if nothing was folded
 */
export const foldBuildFlags = (
  code: string,
  fileName: string,
  flags: Partial<d.UserBuildConditionals>,
): string | null => {
  if (!BUILD_IMPORT_RE.test(code)) {
    return null;
  }
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(fileName),
  );

  const buildSpecifiers = new Set<ts.ImportSpecifier>();
  for (const stmt of sourceFile.statements) {
    if (
      ts.isImportDeclaration(stmt) &&
      stmt.importClause?.phaseModifier !== ts.SyntaxKind.TypeKeyword &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      STENCIL_CORE_IMPORT_RE.test(stmt.moduleSpecifier.text) &&
      stmt.importClause?.namedBindings &&
      ts.isNamedImports(stmt.importClause.namedBindings)
    ) {
      for (const el of stmt.importClause.namedBindings.elements) {
        if (!el.isTypeOnly && (el.propertyName ?? el.name).text === 'Build') {
          buildSpecifiers.add(el);
        }
      }
    }
  }
  if (buildSpecifiers.size === 0) {
    return null;
  }
  const locals = new Set([...buildSpecifiers].map((el) => el.name.text));

  const unsafe = new Set<string>();
  const reads: { local: string; start: number; end: number; value: boolean }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && locals.has(node.text)) {
      const parent = node.parent;
      if (isDeclarationName(node) && !buildSpecifiers.has(parent as ts.ImportSpecifier)) {
        unsafe.add(node.text);
      } else {
        const flag = getAccessedFlag(parent, node);
        if (flag !== undefined) {
          const access = parent as ts.Expression;
          if (isWriteTarget(access)) {
            unsafe.add(node.text);
          } else {
            const value = flags[flag as keyof d.UserBuildConditionals];
            if (typeof value === 'boolean') {
              reads.push({
                local: node.text,
                start: access.getStart(sourceFile),
                end: access.end,
                value,
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const toFold = reads.filter((r) => !unsafe.has(r.local));
  if (toFold.length === 0) {
    return null;
  }

  let out = code;
  for (const { start, end, value } of toFold.sort((a, b) => b.start - a.start)) {
    const original = code.slice(start, end);
    const nl = original.search(/[\r\n]/);
    const head = nl === -1 ? original : original.slice(0, nl);
    const tail = nl === -1 ? '' : original.slice(nl).replace(/[^\r\n]/g, ' ');
    out = out.slice(0, start) + String(value).padEnd(head.length) + tail + out.slice(end);
  }
  return out;
};

const getScriptKind = (fileName: string) => {
  if (/\.tsx$/.test(fileName)) return ts.ScriptKind.TSX;
  if (/\.[mc]?ts$/.test(fileName)) return ts.ScriptKind.TS;
  if (/\.jsx$/.test(fileName)) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
};

const isDeclarationName = (node: ts.Identifier) => {
  const p = node.parent;
  return (
    (ts.isVariableDeclaration(p) ||
      ts.isParameter(p) ||
      ts.isBindingElement(p) ||
      ts.isFunctionDeclaration(p) ||
      ts.isFunctionExpression(p) ||
      ts.isClassDeclaration(p) ||
      ts.isClassExpression(p) ||
      ts.isEnumDeclaration(p) ||
      ts.isModuleDeclaration(p) ||
      ts.isImportEqualsDeclaration(p) ||
      ts.isImportClause(p) ||
      ts.isNamespaceImport(p) ||
      ts.isImportSpecifier(p)) &&
    p.name === node
  );
};

// `Build.flag` / `Build['flag']` -> `'flag'`
const getAccessedFlag = (parent: ts.Node, node: ts.Identifier) => {
  if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
    return parent.name.text;
  }
  if (
    ts.isElementAccessExpression(parent) &&
    parent.expression === node &&
    ts.isStringLiteralLike(parent.argumentExpression)
  ) {
    return parent.argumentExpression.text;
  }
  return undefined;
};

const isWriteTarget = (access: ts.Expression) => {
  const p = access.parent;
  if (ts.isBinaryExpression(p)) {
    return (
      p.left === access &&
      p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      p.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    );
  }
  if (ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) {
    return (
      p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken
    );
  }
  return ts.isDeleteExpression(p);
};
