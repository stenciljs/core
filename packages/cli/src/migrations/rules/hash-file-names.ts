import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for `hashFileNames` and `hashedFileNameLength` config options.
 *
 * In Stencil v5, these are no longer top-level config options. They belong on
 * the `loader-bundle` and `www` output targets, which are the only outputs that
 * are served directly in the browser and benefit from content-hash caching.
 *
 * This migration:
 * 1. Removes them from the top-level config
 * 2. Injects them into any `loader-bundle` and `www` output targets found in the same file
 */
export const hashFileNamesRule: MigrationRule = {
  id: 'hash-file-names',
  name: 'Hash File Names Config Move',
  description:
    'Move hashFileNames and hashedFileNameLength from top-level config to loader-bundle and www output targets',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        (node.name.text === 'hashFileNames' || node.name.text === 'hashedFileNameLength')
      ) {
        // Only match at top-level config — skip if inside an output target object
        // (output targets always have a sibling `type` property)
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(parent)) {
          const isInsideOutputTarget = parent.properties.some(
            (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'type',
          );
          if (!isInsideOutputTarget) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            matches.push({
              node,
              message: `'${node.name.text}' is no longer a top-level config option. Move it to your 'loader-bundle' and/or 'www' output targets.`,
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

    const fullText = sourceFile.getFullText();

    // Extract the prop name/value pairs to inject into output targets
    const propsToInject: { name: string; value: string }[] = matches.map((m) => {
      const node = m.node as ts.PropertyAssignment;
      return {
        name: (node.name as ts.Identifier).text,
        value: node.initializer.getText(sourceFile),
      };
    });

    // Find all loader-bundle and www output target objects, collect insertion points
    const TARGET_TYPES = new Set(['loader-bundle', 'www']);
    // Map from object closing-brace position → props to insert there
    const insertionsByPos = new Map<number, string[]>();

    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const typeProperty = node.properties.find(
          (p): p is ts.PropertyAssignment =>
            ts.isPropertyAssignment(p) &&
            ts.isIdentifier(p.name) &&
            p.name.text === 'type' &&
            ts.isStringLiteral(p.initializer) &&
            TARGET_TYPES.has(p.initializer.text),
        );

        if (typeProperty) {
          const existingPropNames = new Set(
            node.properties
              .filter(
                (p): p is ts.PropertyAssignment =>
                  ts.isPropertyAssignment(p) && ts.isIdentifier(p.name),
              )
              .map((p) => (p.name as ts.Identifier).text),
          );

          // Determine indentation from the line containing the opening `{`
          const objStart = node.getStart(sourceFile);
          const objLineStart = fullText.lastIndexOf('\n', objStart) + 1;
          const indent = fullText.slice(objLineStart, objStart).match(/^(\s*)/)?.[1] ?? '';
          const propIndent = indent + '  ';

          const closingBracePos = node.getEnd() - 1;
          const isMultiLine = fullText.slice(objStart, node.getEnd()).includes('\n');

          // For multi-line objects, insert before the newline that precedes `}` so the
          // result is a proper new line rather than text crammed onto the `}` line.
          // For single-line objects, trim trailing whitespace before `}` to avoid
          // placing the comma after any padding space (e.g. `{ type: 'x' }` → `{ type: 'x', … }`).
          let insertPos: number;
          if (isMultiLine) {
            insertPos = fullText.lastIndexOf('\n', closingBracePos - 1);
          } else {
            insertPos = closingBracePos;
            while (insertPos > 0 && fullText[insertPos - 1] === ' ') {
              insertPos--;
            }
          }

          const existing = insertionsByPos.get(insertPos) ?? [];
          for (const prop of propsToInject) {
            if (!existingPropNames.has(prop.name)) {
              existing.push(
                isMultiLine
                  ? `\n${propIndent}${prop.name}: ${prop.value},`
                  : `, ${prop.name}: ${prop.value}`,
              );
            }
          }
          if (existing.length > 0) {
            insertionsByPos.set(insertPos, existing);
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Build all edits: removals (top-level props) + insertions (into output targets)
    type Edit = { start: number; end: number; replacement: string };
    const edits: Edit[] = [];

    for (const match of matches) {
      const node = match.node as ts.PropertyAssignment;
      const start = node.getFullStart();
      const end = node.getEnd();
      let removeEnd = end;
      const trailingComma = fullText.slice(end).match(/^\s*,/);
      if (trailingComma) {
        removeEnd = end + trailingComma[0].length;
      }
      edits.push({ start, end: removeEnd, replacement: '' });
    }

    for (const [pos, insertions] of insertionsByPos) {
      edits.push({ start: pos, end: pos, replacement: insertions.join('') });
    }

    // Apply edits in reverse position order so earlier offsets stay valid
    edits.sort((a, b) => b.start - a.start);

    let text = fullText;
    for (const edit of edits) {
      text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
    }

    return text;
  },
};
