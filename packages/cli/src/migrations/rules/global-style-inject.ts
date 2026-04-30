import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for `extras.addGlobalStyleToComponents` → `global-style` output target `inject`.
 *
 * In v5, the `addGlobalStyleToComponents` extras option is removed. Instead, configure
 * the `inject` option on the `global-style` output target.
 *
 * Migration mapping:
 * - `addGlobalStyleToComponents: true` → `inject: 'all'`
 * - `addGlobalStyleToComponents: 'client'` → `inject: 'client'`
 * - `addGlobalStyleToComponents: false` → omit (default is 'none')
 *
 * Note: This migration only acts on explicitly set `addGlobalStyleToComponents`.
 * Users who relied on the implicit v4 default ('client') will need to manually
 * add `inject: 'client'` to their global-style output target if desired.
 */
export const globalStyleInjectRule: MigrationRule = {
  id: 'global-style-inject',
  name: 'Global Style Inject Migration',
  description:
    'Migrate extras.addGlobalStyleToComponents to global-style output target inject option',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      // Look for extras.addGlobalStyleToComponents
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'addGlobalStyleToComponents'
      ) {
        // Check if this is inside an 'extras' object
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
              message: `extras.addGlobalStyleToComponents is removed. Use 'inject' on global-style output target instead.`,
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

    // Get the matched node (already validated as PropertyAssignment in extras)
    const matchNode = matches[0].node;
    if (!ts.isPropertyAssignment(matchNode)) {
      return text;
    }

    // Determine inject value from the node's initializer
    let injectValue: 'all' | 'client' | null = null;
    if (matchNode.initializer.kind === ts.SyntaxKind.TrueKeyword) {
      injectValue = 'all';
    } else if (
      ts.isStringLiteral(matchNode.initializer) &&
      matchNode.initializer.text === 'client'
    ) {
      injectValue = 'client';
    }
    // false or other values → null (default 'none', no injection needed)

    // Add global-style output target FIRST while AST positions are still valid
    let insertionOffset = 0;
    if (injectValue) {
      const result = addGlobalStyleOutputTarget(text, sourceFile, injectValue);
      insertionOffset = result.length - text.length;
      text = result;
    }

    // Remove the addGlobalStyleToComponents property
    let start = matchNode.getStart();
    let end = matchNode.getEnd();

    // Adjust positions if we inserted content before this node (extras typically comes after outputTargets)
    const outputTargetsEnd = findOutputTargetsEnd(sourceFile);
    if (
      insertionOffset !== 0 &&
      outputTargetsEnd !== null &&
      matchNode.getStart() > outputTargetsEnd
    ) {
      start += insertionOffset;
      end += insertionOffset;
    }

    // Handle trailing comma
    const afterProp = text.slice(end).match(/^\s*,/);
    if (afterProp) {
      end = end + afterProp[0].length;
    } else {
      // Check for leading comma
      const beforeProp = text.slice(0, start).match(/,\s*$/);
      if (beforeProp) {
        text = text.slice(0, start - beforeProp[0].length) + text.slice(end);
        end = -1;
      }
    }

    if (end !== -1) {
      text = text.slice(0, start) + text.slice(end);
    }

    // Check if extras object is now empty and remove it if so
    text = cleanupEmptyExtras(text);

    return text;
  },
};

/**
 * Find the end position of the outputTargets array in the source file.
 * @param sourceFile The source file to search
 * @returns The end position of the outputTargets array, or null if not found
 */
function findOutputTargetsEnd(sourceFile: ts.SourceFile): number | null {
  let endPos: number | null = null;
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'outputTargets'
    ) {
      endPos = node.getEnd();
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return endPos;
}

/**
 * Clean up empty extras object after removing addGlobalStyleToComponents.
 * @param text The source text to clean up
 * @returns The cleaned up text with empty extras removed
 */
function cleanupEmptyExtras(text: string): string {
  // Match extras: { } or extras: {\n  } with only whitespace inside
  const emptyExtrasRegex = /,?\s*extras\s*:\s*\{\s*\},?/g;
  return text.replace(emptyExtrasRegex, '');
}

/**
 * Add a global-style output target with the specified inject value.
 * @param text The source text to modify
 * @param sourceFile The source file for position info
 * @param injectValue The inject value to set on the new global-style output target
 * @returns The modified text with the new global-style output target added
 */
function addGlobalStyleOutputTarget(
  text: string,
  sourceFile: ts.SourceFile,
  injectValue: 'all' | 'client',
): string {
  // Check if global-style output target already exists
  const hasGlobalStyleTarget = text.includes("type: 'global-style'");
  if (hasGlobalStyleTarget) {
    // TODO: Could add inject to existing target, but for now just skip
    return text;
  }

  // Find outputTargets array
  let outputTargetsArray: ts.ArrayLiteralExpression | null = null;
  const findOutputTargets = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'outputTargets' &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      outputTargetsArray = node.initializer;
    }
    ts.forEachChild(node, findOutputTargets);
  };
  findOutputTargets(sourceFile);

  if (!outputTargetsArray) {
    // No outputTargets array found, can't add
    return text;
  }

  const array: ts.ArrayLiteralExpression = outputTargetsArray;

  // Detect indentation
  let indent = '    ';
  if (array.elements.length > 0) {
    const firstElement = array.elements[0];
    const elemStart = firstElement.getStart();
    const lineStart = text.lastIndexOf('\n', elemStart) + 1;
    const leadingWhitespace = text.slice(lineStart, elemStart);
    if (/^\s+$/.test(leadingWhitespace)) {
      indent = leadingWhitespace;
    }
  }

  // Find insertion point
  const lastElement = array.elements[array.elements.length - 1];
  if (!lastElement) {
    // Empty array, insert at start
    const arrayStart = array.getStart() + 1; // After '['
    const newTarget = `\n${indent}{\n${indent}  type: 'global-style',\n${indent}  inject: '${injectValue}',\n${indent}}\n${indent.slice(2)}`;
    return text.slice(0, arrayStart) + newTarget + text.slice(arrayStart);
  }

  let insertPos = lastElement.getEnd();

  // Check for trailing comma
  const afterLastElement = text.slice(insertPos).match(/^(\s*,)?/);
  const hasTrailingComma = afterLastElement && afterLastElement[1];
  if (hasTrailingComma) {
    insertPos += afterLastElement[0].length;
  }

  const newTarget = `{\n${indent}  type: 'global-style',\n${indent}  inject: '${injectValue}',\n${indent}}`;
  // Only add comma prefix if there wasn't already a trailing comma
  const insertion = (hasTrailingComma ? '' : ',') + '\n' + indent + newTarget;

  return text.slice(0, insertPos) + insertion + text.slice(insertPos);
}
