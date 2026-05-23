import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for `externalRuntime` on `standalone` output targets.
 *
 * In Stencil v5, `externalRuntime` defaults to `false` (was `true` in v4).
 * Explicit `externalRuntime: false` is now redundant and can be removed.
 */
export const externalRuntimeRule: MigrationRule = {
  id: 'external-runtime',
  name: 'externalRuntime Default Change',
  description:
    "Remove redundant 'externalRuntime: false' from standalone output targets  false is now the default",
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'externalRuntime' &&
        node.initializer.kind === ts.SyntaxKind.FalseKeyword
      ) {
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(parent)) {
          const isStandaloneTarget = parent.properties.some(
            (p): p is ts.PropertyAssignment =>
              ts.isPropertyAssignment(p) &&
              ts.isIdentifier(p.name) &&
              p.name.text === 'type' &&
              ts.isStringLiteral(p.initializer) &&
              p.initializer.text === 'standalone',
          );
          if (isStandaloneTarget) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            matches.push({
              node,
              message: "'externalRuntime: false' is now the default  this property can be removed",
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return matches;
  },

  transform(sourceFile: ts.SourceFile, matches: MigrationMatch[]): string {
    if (matches.length === 0) {
      return sourceFile.getFullText();
    }

    let text = sourceFile.getFullText();

    for (const match of [...matches].reverse()) {
      const node = match.node as ts.PropertyAssignment;
      const start = node.getFullStart();
      const end = node.getEnd();

      let removeEnd = end;
      const trailingComma = text.slice(end).match(/^\s*,/);
      if (trailingComma) {
        removeEnd = end + trailingComma[0].length;
      }

      text = text.slice(0, start) + text.slice(removeEnd);
    }

    return text;
  },
};
