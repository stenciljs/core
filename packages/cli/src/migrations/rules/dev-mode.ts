import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for `devMode` config option removal.
 *
 * In Stencil v5, `devMode` is no longer a user-settable config option in `stencil.config.ts`.
 * Build mode is controlled exclusively by the `--dev` CLI flag (default is production).
 * This migration removes `devMode` from the config object.
 */
export const devModeRule: MigrationRule = {
  id: 'dev-mode',
  name: 'devMode Config Removal',
  description: 'Remove deprecated devMode config option - use --dev CLI flag instead',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
        if (node.name.text === 'devMode') {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          matches.push({
            node,
            message: `Deprecated 'devMode' config option found - build mode is now set via the --dev CLI flag (production is the default)`,
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
    if (matches.length === 0) {
      return sourceFile.getFullText();
    }

    let text = sourceFile.getFullText();

    // Remove matches in reverse order to preserve character offsets
    for (const match of [...matches].reverse()) {
      const node = match.node as ts.PropertyAssignment;
      const start = node.getFullStart();
      const end = node.getEnd();

      // Also consume a trailing comma if present
      let removeEnd = end;
      const afterNode = text.slice(end);
      const trailingComma = afterNode.match(/^\s*,/);
      if (trailingComma) {
        removeEnd = end + trailingComma[0].length;
      }

      text = text.slice(0, start) + text.slice(removeEnd);
    }

    return text;
  },
};
