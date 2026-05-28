import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule: rename the top-level `extras` config key to `compat`.
 *
 * In v5, `extras` is replaced by `compat` (framework/bundler compatibility flags).
 */
export const extrasToCompatRule: MigrationRule = {
  id: 'extras-to-compat',
  name: 'Extras → Compat Rename',
  description: "Rename top-level 'extras' config key to 'compat'",

  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
        if (node.name.text === 'extras') {
          // Only match top-level config objects (parent is an object literal directly exported
          // or assigned to a variable - not nested inside outputTargets etc.)
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          matches.push({
            node,
            message: "'extras' has been renamed to 'compat'",
            line: line + 1,
            column: character + 1,
          });
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
      const key = (node.name as ts.Identifier).text;

      if (key === 'extras') {
        // Replace just the key name, preserving the value and all formatting
        const keyStart = node.name.getStart();
        const keyEnd = node.name.getEnd();
        text = text.slice(0, keyStart) + 'compat' + text.slice(keyEnd);
      } 
    }

    return text;
  },
};
