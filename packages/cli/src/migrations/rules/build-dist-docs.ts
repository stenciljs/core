import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for buildDist and buildDocs removal.
 *
 * In Stencil v5, these global config options are replaced with per-output-target
 * `skipInDev` property. This migration:
 * - Detects `buildDist` or `buildDocs` in stencil.config.ts
 * - Removes the property
 * - For `buildDist: true` or `buildDocs: true`, adds `skipInDev: false` to relevant output targets
 */
export const buildDistDocsRule: MigrationRule = {
  id: 'build-dist-docs',
  name: 'buildDist/buildDocs Removal',
  description: 'Remove deprecated buildDist and buildDocs config options',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      // Look for property assignments: buildDist: ... or buildDocs: ...
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
        const propName = node.name.text;
        if (propName === 'buildDist' || propName === 'buildDocs') {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const isTrue = node.initializer.kind === ts.SyntaxKind.TrueKeyword;
          matches.push({
            node,
            message: `Deprecated '${propName}' found${isTrue ? ' (set to true)' : ''} - will be removed and skipInDev added to output targets`,
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

    // Determine which output target types need skipInDev: false
    const targetTypesNeedingSkipInDev: string[] = [];

    for (const match of matches) {
      const prop = match.node as ts.PropertyAssignment;
      const propName = (prop.name as ts.Identifier).text;
      const isTrue = prop.initializer.kind === ts.SyntaxKind.TrueKeyword;

      if (isTrue) {
        if (propName === 'buildDist') {
          targetTypesNeedingSkipInDev.push('dist', 'dist-custom-elements', 'dist-hydrate-script');
        } else if (propName === 'buildDocs') {
          targetTypesNeedingSkipInDev.push(
            'docs-readme',
            'docs-json',
            'docs-custom',
            'docs-vscode',
            'docs-custom-elements-manifest',
          );
        }
      }
    }

    // Find output targets that need skipInDev: false added
    const outputTargetsToModify: ts.ObjectLiteralExpression[] = [];

    const findOutputTargets = (node: ts.Node) => {
      // Look for outputTargets: [...]
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'outputTargets' &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        for (const element of node.initializer.elements) {
          if (ts.isObjectLiteralExpression(element)) {
            // Check if this output target has a type that needs skipInDev
            const typeProp = element.properties.find(
              (p) =>
                ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'type',
            ) as ts.PropertyAssignment | undefined;

            if (typeProp && ts.isStringLiteral(typeProp.initializer)) {
              const targetType = typeProp.initializer.text;
              if (targetTypesNeedingSkipInDev.includes(targetType)) {
                // Check if skipInDev is already set
                const hasSkipInDev = element.properties.some(
                  (p) =>
                    ts.isPropertyAssignment(p) &&
                    ts.isIdentifier(p.name) &&
                    p.name.text === 'skipInDev',
                );
                if (!hasSkipInDev) {
                  outputTargetsToModify.push(element);
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, findOutputTargets);
    };

    findOutputTargets(sourceFile);

    // Sort all modifications by position (descending) to preserve positions
    const allModifications: Array<{
      type: 'remove' | 'addSkipInDev';
      start: number;
      end: number;
      node: ts.Node;
    }> = [];

    // Add removals for buildDist/buildDocs
    for (const match of matches) {
      const prop = match.node as ts.PropertyAssignment;
      const start = prop.getStart();
      let end = prop.getEnd();

      // Handle trailing comma
      const afterProp = text.slice(end).match(/^\s*,/);
      if (afterProp) {
        end = end + afterProp[0].length;
      }

      allModifications.push({ type: 'remove', start, end, node: prop });
    }

    // Add skipInDev insertions
    for (const target of outputTargetsToModify) {
      // Find the last property in the object to insert after
      const lastProp = target.properties[target.properties.length - 1];
      if (lastProp) {
        allModifications.push({
          type: 'addSkipInDev',
          start: lastProp.getEnd(),
          end: lastProp.getEnd(),
          node: target,
        });
      }
    }

    // Sort by position descending
    allModifications.sort((a, b) => b.start - a.start);

    // Apply modifications
    for (const mod of allModifications) {
      if (mod.type === 'remove') {
        text = text.slice(0, mod.start) + text.slice(mod.end);
      } else if (mod.type === 'addSkipInDev') {
        // Detect indentation from the object
        const target = mod.node as ts.ObjectLiteralExpression;
        const firstProp = target.properties[0];
        let indent = '      ';
        if (firstProp) {
          const propStart = firstProp.getStart();
          const lineStart = text.lastIndexOf('\n', propStart) + 1;
          const leadingWhitespace = text.slice(lineStart, propStart);
          if (/^\s+$/.test(leadingWhitespace)) {
            indent = leadingWhitespace;
          }
        }

        // Check if there's a trailing comma after the last property value
        const afterLastProp = text.slice(mod.start).match(/^(\s*,)?/);
        const hasTrailingComma = afterLastProp && afterLastProp[1];
        const skipLength = hasTrailingComma ? afterLastProp[0].length : 0;

        // Insert the new property, replacing any trailing comma
        text =
          text.slice(0, mod.start) +
          `,\n${indent}skipInDev: false,` +
          text.slice(mod.start + skipLength);
      }
    }

    // Clean up any empty lines left behind
    text = text.replace(/,\s*\n\s*\n/g, ',\n');
    text = text.replace(/{\s*\n\s*\n/g, '{\n');

    return text;
  },
};
