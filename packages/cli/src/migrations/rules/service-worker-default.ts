import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for `serviceWorker: null` / `serviceWorker: false` on `www` output targets.
 *
 * In Stencil v5, `serviceWorker` defaults to `null` (disabled). Explicit `null` or `false`
 * values on `www` output targets are now redundant and can be removed.
 */
export const serviceWorkerDefaultRule: MigrationRule = {
  id: 'service-worker-default',
  name: 'Service Worker Default Cleanup',
  description:
    "Remove redundant 'serviceWorker: null' / 'serviceWorker: false' from www output targets - null is now the default",
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'serviceWorker'
      ) {
        const init = node.initializer;
        const isNullOrFalse =
          init.kind === ts.SyntaxKind.NullKeyword || init.kind === ts.SyntaxKind.FalseKeyword;

        if (isNullOrFalse) {
          // Only match inside a www output target object
          const parent = node.parent;
          if (ts.isObjectLiteralExpression(parent)) {
            const isWwwTarget = parent.properties.some(
              (p) =>
                ts.isPropertyAssignment(p) &&
                ts.isIdentifier(p.name) &&
                p.name.text === 'type' &&
                ts.isStringLiteral(p.initializer) &&
                p.initializer.text === 'www',
            );
            if (isWwwTarget) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              matches.push({
                node,
                message: `'serviceWorker: ${init.kind === ts.SyntaxKind.NullKeyword ? 'null' : 'false'}' is now the default on www output targets and can be removed`,
                line: line + 1,
                column: character + 1,
              });
            }
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
      let start = node.getFullStart();
      const end = node.getEnd();

      let removeEnd = end;
      const trailingComma = text.slice(end).match(/^\s*,/);
      if (trailingComma) {
        removeEnd = end + trailingComma[0].length;
      } else {
        // Last property - also consume the preceding comma to avoid `{ type: 'www', }`
        const leadingComma = text.slice(0, start).match(/,\s*$/);
        if (leadingComma) {
          start -= leadingComma[0].length;
        }
      }

      text = text.slice(0, start) + text.slice(removeEnd);
    }

    return text;
  },
};
