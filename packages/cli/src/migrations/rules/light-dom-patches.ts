import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for slot-fix extras → `lightDomPatches`.
 *
 * In v5, the individual slot-fix flags and `experimentalSlotFixes` umbrella are replaced
 * by a single `lightDomPatches` option which defaults to `true`.
 *
 * Migration mapping:
 * - `experimentalSlotFixes: true`  → remove (new default is `true`)
 * - `experimentalSlotFixes: false` → `lightDomPatches: false`
 * - Individual flags only          → `lightDomPatches: { <new names> }`
 *
 * Old → new individual key names:
 *   appendChildSlotFix      → domMutations
 *   cloneNodeFix            → cloneNode
 *   scopedSlotTextContentFix → textContent
 *   slotChildNodesFix       → childNodes
 */
export const lightDomPatchesRule: MigrationRule = {
  id: 'light-dom-patches',
  name: 'Light DOM Patches Migration',
  description: 'Migrate experimentalSlotFixes / individual slot-fix flags to lightDomPatches',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];
    const oldKeys = new Set([
      'experimentalSlotFixes',
      'appendChildSlotFix',
      'cloneNodeFix',
      'scopedSlotTextContentFix',
      'slotChildNodesFix',
    ]);

    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        oldKeys.has(node.name.text)
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
              message: `extras.${node.name.text} is removed. Use 'extras.lightDomPatches' instead.`,
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

    // Collect all old-flag nodes inside the extras object
    const oldKeyMap: Record<string, boolean | undefined> = {};
    for (const match of matches) {
      const node = match.node as ts.PropertyAssignment;
      const key = (node.name as ts.Identifier).text;
      const init = node.initializer;
      oldKeyMap[key] =
        init.kind === ts.SyntaxKind.TrueKeyword
          ? true
          : init.kind === ts.SyntaxKind.FalseKeyword
            ? false
            : undefined; // dynamic / unknown value
    }

    const keyRename: Record<string, string> = {
      appendChildSlotFix: 'domMutations',
      cloneNodeFix: 'cloneNode',
      scopedSlotTextContentFix: 'textContent',
      slotChildNodesFix: 'childNodes',
    };

    const experimentalValue = oldKeyMap['experimentalSlotFixes'];
    const hasIndividualKeys = matches.some((m) => {
      const key = ((m.node as ts.PropertyAssignment).name as ts.Identifier).text;
      return key !== 'experimentalSlotFixes';
    });

    // Determine replacement value for lightDomPatches
    let replacement: string | null = null;

    if (experimentalValue === true && !hasIndividualKeys) {
      // experimentalSlotFixes: true with no individual flags → remove (default is now true)
      replacement = null;
    } else if (experimentalValue === false && !hasIndividualKeys) {
      // Explicit opt-out
      replacement = 'lightDomPatches: false';
    } else if (experimentalValue === true && hasIndividualKeys) {
      // experimentalSlotFixes: true overrides individual flags — treat as all-on
      replacement = null; // new default covers this
    } else {
      // Individual flags only (no experimentalSlotFixes, or unknown value)
      const parts: string[] = [];
      for (const [oldKey, newKey] of Object.entries(keyRename)) {
        const val = oldKeyMap[oldKey];
        if (val === true) parts.push(`${newKey}: true`);
        else if (val === false) parts.push(`${newKey}: false`);
        // undefined (dynamic) → omit; user must handle manually
      }
      if (parts.length > 0) {
        replacement = `lightDomPatches: { ${parts.join(', ')} }`;
      }
    }

    // Sort matches by position descending so we can splice without offset drift
    const sorted = [...matches].sort((a, b) => b.node.getStart() - a.node.getStart());

    let text = sourceFile.getFullText();
    let replacementInserted = false;

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

      if (!replacementInserted && replacement !== null) {
        text = text.slice(0, start) + replacement + text.slice(end);
        replacementInserted = true;
      } else {
        text = text.slice(0, start) + text.slice(end);
      }
    }

    text = cleanupEmptyExtras(text);
    return text;
  },
};

function cleanupEmptyExtras(text: string): string {
  return text.replace(/,?\s*extras\s*:\s*\{\s*\},?/g, '');
}
