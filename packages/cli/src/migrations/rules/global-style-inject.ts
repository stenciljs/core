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
 * - `addGlobalStyleToComponents: false` → `inject: 'none'` (a stylesheet from `globalStyle` defaults
 *   to `'client'`, so omitting it would start injecting)
 *
 * The top-level `globalStyle` option moves into the new output target as well, so the config
 * isn't left describing one stylesheet in two places:
 *
 * ```ts
 * { type: 'global-style', input: 'src/global/app.css', fileName: 'my-lib.css', inject: 'none', copyToLoaderBrowser: true }
 * ```
 *
 * `fileName` is written (from `namespace`) because a target with an explicit `input` otherwise
 * names its output after the input file, where `globalStyle` used `{namespace}.css`.
 * When `globalStyle` isn't a string literal in the config (e.g. the stylesheet is auto-detected
 * from `src/global.*`), only `{ type: 'global-style', inject }` is written.
 *
 * Note: This migration only acts on explicitly set `addGlobalStyleToComponents`. A config
 * without it keeps `globalStyle` as it is, which still injects on the client as v4 did.
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
    const original = sourceFile.getFullText();
    if (matches.length === 0) {
      return original;
    }

    // Get the matched node (already validated as PropertyAssignment in extras)
    const matchNode = matches[0].node;
    if (!ts.isPropertyAssignment(matchNode)) {
      return original;
    }

    // Determine inject value from the node's initializer
    let injectValue: InjectValue | null = null;
    if (matchNode.initializer.kind === ts.SyntaxKind.TrueKeyword) {
      injectValue = 'all';
    } else if (
      ts.isStringLiteral(matchNode.initializer) &&
      matchNode.initializer.text === 'client'
    ) {
      injectValue = 'client';
    } else if (matchNode.initializer.kind === ts.SyntaxKind.FalseKeyword) {
      injectValue = 'none';
    }
    // other values → null, the property is only removed

    // Every edit is a range of the original text, applied back to front so positions stay valid
    const edits: TextEdit[] = [removalOf(original, matchNode)];

    const outputTargets = findTopLevelProperty(sourceFile, 'outputTargets');
    const hasGlobalStyleTarget = original.includes("type: 'global-style'");
    if (
      injectValue &&
      !hasGlobalStyleTarget &&
      outputTargets &&
      ts.isArrayLiteralExpression(outputTargets.initializer)
    ) {
      const globalStyle = findTopLevelProperty(sourceFile, 'globalStyle');
      const namespace = findTopLevelProperty(sourceFile, 'namespace');
      const props: string[] = [`type: 'global-style'`];

      if (globalStyle && ts.isStringLiteralLike(globalStyle.initializer)) {
        props.push(`input: ${globalStyle.initializer.getText()}`);
        if (namespace && ts.isStringLiteralLike(namespace.initializer)) {
          props.push(`fileName: '${namespace.initializer.text.toLowerCase().trim()}.css'`);
        }
        edits.push(removalOf(original, globalStyle));
      }

      props.push(`inject: '${injectValue}'`);
      if (props.length > 2) {
        props.push(`copyToLoaderBrowser: true`);
      }

      edits.push(insertionOfOutputTarget(original, outputTargets.initializer, props));
    }

    let text = original;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
    }

    // Check if extras object is now empty and remove it if so
    return cleanupEmptyExtras(text);
  },
};

type InjectValue = 'all' | 'client' | 'none';

interface TextEdit {
  start: number;
  end: number;
  text: string;
}

/**
 * Find a property of the exported config object, e.g. `globalStyle` or `outputTargets`.
 * @param sourceFile The source file to search
 * @param name The property name
 * @returns The property assignment, or null if the config has no such top-level property
 */
function findTopLevelProperty(
  sourceFile: ts.SourceFile,
  name: string,
): ts.PropertyAssignment | null {
  let found: ts.PropertyAssignment | null = null;
  const visit = (node: ts.Node, depth: number): void => {
    if (found) return;
    if (ts.isObjectLiteralExpression(node)) {
      // Only the outermost object literal is the config itself
      if (depth > 0) return;
      for (const prop of node.properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === name
        ) {
          found = prop;
          return;
        }
      }
      return;
    }
    ts.forEachChild(node, (child) => visit(child, depth));
  };
  visit(sourceFile, 0);
  return found;
}

/**
 * Build the edit that removes a property, together with its trailing comma and its own line.
 * @param text The original source text
 * @param node The property to remove
 * @returns The edit
 */
function removalOf(text: string, node: ts.Node): TextEdit {
  let start = node.getStart();
  let end = node.getEnd();

  const trailingComma = text.slice(end).match(/^\s*,/);
  if (trailingComma) {
    end += trailingComma[0].length;
  } else {
    const leadingComma = text.slice(0, start).match(/,\s*$/);
    if (leadingComma) {
      return { start: start - leadingComma[0].length, end, text: '' };
    }
  }

  // Take the whole line when the property was alone on it
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const restOfLine = text.slice(end).match(/^[ \t]*\n/);
  if (/^[ \t]*$/.test(text.slice(lineStart, start)) && restOfLine) {
    start = lineStart;
    end += restOfLine[0].length;
  }

  return { start, end, text: '' };
}

/**
 * Build the edit that appends a `global-style` output target to the `outputTargets` array.
 * @param text The original source text
 * @param array The `outputTargets` array
 * @param props The new output target's properties, as source text
 * @returns The edit
 */
function insertionOfOutputTarget(
  text: string,
  array: ts.ArrayLiteralExpression,
  props: string[],
): TextEdit {
  // Detect indentation
  let indent = '    ';
  if (array.elements.length > 0) {
    const elemStart = array.elements[0].getStart();
    const lineStart = text.lastIndexOf('\n', elemStart) + 1;
    const leadingWhitespace = text.slice(lineStart, elemStart);
    if (/^\s+$/.test(leadingWhitespace)) {
      indent = leadingWhitespace;
    }
  }

  const body = props.map((prop) => `${indent}  ${prop},\n`).join('');
  const newTarget = `{\n${body}${indent}}`;

  const lastElement = array.elements[array.elements.length - 1];
  if (!lastElement) {
    // Empty array, insert at start
    const arrayStart = array.getStart() + 1; // After '['
    return {
      start: arrayStart,
      end: arrayStart,
      text: `\n${indent}${newTarget}\n${indent.slice(2)}`,
    };
  }

  let insertPos = lastElement.getEnd();

  // Check for trailing comma
  const afterLastElement = text.slice(insertPos).match(/^(\s*,)?/);
  const hasTrailingComma = afterLastElement && afterLastElement[1];
  if (hasTrailingComma) {
    insertPos += afterLastElement[0].length;
  }

  // Only add comma prefix if there wasn't already a trailing comma
  return {
    start: insertPos,
    end: insertPos,
    text: (hasTrailingComma ? '' : ',') + '\n' + indent + newTarget,
  };
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
