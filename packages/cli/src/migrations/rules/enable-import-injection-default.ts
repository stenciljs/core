import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule: drop `extras.enableImportInjection: true`.
 *
 * In v4 this flag defaulted to `false`, so an explicit `true` was meaningful. In v5 it
 * defaults to `true`, so an explicit `true` is now a no-op. `false` (opting out) is left alone.
 */
export const enableImportInjectionDefaultRule: MigrationRule = {
  id: 'enable-import-injection-default',
  name: 'Drop redundant enableImportInjection: true',
  description: "Remove 'extras.enableImportInjection: true' now that it's the v5 default",

  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'enableImportInjection' &&
        node.initializer.kind === ts.SyntaxKind.TrueKeyword
      ) {
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(parent)) {
          const grandparent = parent.parent;
          if (
            ts.isPropertyAssignment(grandparent) &&
            ts.isIdentifier(grandparent.name) &&
            grandparent.name.text === 'extras'
          ) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            matches.push({
              node,
              message: "'extras.enableImportInjection: true' is now the default and can be removed",
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
    if (matches.length === 0) return sourceFile.getFullText();

    let text = sourceFile.getFullText();

    // Process in reverse order to avoid offset drift
    const sorted = [...matches].sort((a, b) => b.node.getStart() - a.node.getStart());

    for (const match of sorted) {
      const node = match.node as ts.PropertyAssignment;
      let start = node.getStart();
      let end = node.getEnd();

      // Include trailing comma if present
      const afterNode = text.slice(end);
      const trailingComma = afterNode.match(/^(\s*,)/);
      if (trailingComma) {
        end += trailingComma[1].length;
      } else {
        // Include leading comma if present (last property)
        const beforeNode = text.slice(0, start);
        const leadingComma = beforeNode.match(/,\s*$/);
        if (leadingComma) {
          start -= leadingComma[0].length;
        }
      }

      text = text.slice(0, start) + text.slice(end);
    }

    text = cleanupEmptyExtras(text);
    return text;
  },
};

function cleanupEmptyExtras(text: string): string {
  return text.replace(/,?\s*extras\s*:\s*\{\s*\},?/g, '');
}
