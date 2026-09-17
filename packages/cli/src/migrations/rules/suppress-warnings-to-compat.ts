import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule: move `suppressReservedPublicNameWarnings` / `suppressReservedEventNameWarnings`
 * off the top level of the config and into `compat`, dropping `Reserved` from their names.
 *
 * In v5:
 *   suppressReservedPublicNameWarnings → compat.suppressPublicNameWarnings
 *   suppressReservedEventNameWarnings  → compat.suppressEventNameWarnings
 */
const KEY_RENAME: Record<string, string> = {
  suppressReservedPublicNameWarnings: 'suppressPublicNameWarnings',
  suppressReservedEventNameWarnings: 'suppressEventNameWarnings',
};

export const suppressWarningsToCompatRule: MigrationRule = {
  id: 'suppress-warnings-to-compat',
  name: 'Suppress Warnings → Compat',
  description:
    "Move 'suppressReservedPublicNameWarnings' / 'suppressReservedEventNameWarnings' into 'compat'",

  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text in KEY_RENAME
      ) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        matches.push({
          node,
          message: `'${node.name.text}' has moved to 'compat.${KEY_RENAME[node.name.text]}'`,
          line: line + 1,
          column: character + 1,
        });
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return matches;
  },

  transform(sourceFile: ts.SourceFile, matches: MigrationMatch[]): string {
    if (matches.length === 0) return sourceFile.getFullText();

    const text = sourceFile.getFullText();
    const edits: { start: number; end: number; replacement: string }[] = [];
    const newProps: string[] = [];

    // Remove each old top-level property (including its comma), and record its renamed replacement.
    for (const match of matches) {
      const node = match.node as ts.PropertyAssignment;
      const key = (node.name as ts.Identifier).text;
      newProps.push(`${KEY_RENAME[key]}: ${node.initializer.getText(sourceFile)}`);

      let start = node.getStart();
      let end = node.getEnd();
      const afterNode = text.slice(end);
      const trailingComma = afterNode.match(/^(\s*,)/);
      if (trailingComma) {
        end += trailingComma[1].length;
      } else {
        const beforeNode = text.slice(0, start);
        const leadingComma = beforeNode.match(/,\s*$/);
        if (leadingComma) {
          start -= leadingComma[0].length;
        }
      }
      edits.push({ start, end, replacement: '' });
    }

    // All matched properties are assumed to be siblings on the same config object literal.
    const parentObject = (matches[0].node as ts.PropertyAssignment)
      .parent as ts.ObjectLiteralExpression;

    const existingCompat = parentObject.properties.find(
      (p): p is ts.PropertyAssignment =>
        ts.isPropertyAssignment(p) &&
        ts.isIdentifier(p.name) &&
        p.name.text === 'compat' &&
        ts.isObjectLiteralExpression(p.initializer),
    );

    if (existingCompat) {
      edits.push(
        insertIntoObjectLiteral(existingCompat.initializer as ts.ObjectLiteralExpression, newProps),
      );
    } else {
      edits.push(insertIntoObjectLiteral(parentObject, [`compat: { ${newProps.join(', ')} }`]));
    }

    // Apply right-to-left so earlier offsets stay valid.
    let result = text;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }

    return result;
  },
};

function insertIntoObjectLiteral(
  obj: ts.ObjectLiteralExpression,
  newProps: string[],
): { start: number; end: number; replacement: string } {
  if (obj.properties.length === 0) {
    const pos = obj.getStart() + 1;
    return { start: pos, end: pos, replacement: ` ${newProps.join(', ')} ` };
  }
  const last = obj.properties[obj.properties.length - 1];
  return { start: last.getEnd(), end: last.getEnd(), replacement: `, ${newProps.join(', ')}` };
}
