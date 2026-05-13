import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for output target renames in Stencil v5.
 *
 * This migration:
 * - Renames `dist` → `loader-bundle`
 * - Renames `dist-custom-elements` → `standalone`
 * - Renames `dist-hydrate-script` → `ssr`
 * - Renames `dist-collection` → `collection`
 * - Renames `dist-types` → `types`
 * - Extracts `collectionDir` from loader-bundle into separate `collection` output
 * - Extracts `typesDir` from loader-bundle into separate `types` output
 * - Renames `esmLoaderPath` → `loaderPath` (applies to all module formats, not just ESM)
 * - Removes `isPrimaryPackageOutputTarget` (no longer needed, package.json validation auto-detects)
 * - Removes `generateTypeDeclarations` (types are now auto-generated via the `types` output target)
 */
export const outputTargetRenamesRule: MigrationRule = {
  id: 'output-target-renames',
  name: 'Output Target Renames',
  description: 'Rename output targets to new v5 names',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const oldToNewNames: Record<string, string> = {
      dist: 'loader-bundle',
      'dist-custom-elements': 'standalone',
      'dist-hydrate-script': 'ssr',
      'dist-collection': 'collection',
      'dist-types': 'types',
    };

    const visit = (node: ts.Node) => {
      // Look for type: 'old-name' in output target objects
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'type' &&
        ts.isStringLiteral(node.initializer)
      ) {
        const typeValue = node.initializer.text;
        if (typeValue in oldToNewNames) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          matches.push({
            node,
            message: `Output target type '${typeValue}' → '${oldToNewNames[typeValue]}'`,
            line: line + 1,
            column: character + 1,
          });
        }
      }

      // Look for collectionDir or typesDir properties in output targets
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        (node.name.text === 'collectionDir' || node.name.text === 'typesDir')
      ) {
        // Check if this is inside an output target object (has a 'type' property sibling)
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(parent)) {
          const hasTypeProperty = parent.properties.some(
            (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'type',
          );
          if (hasTypeProperty) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const propName = node.name.text;
            const newType = propName === 'collectionDir' ? 'collection' : 'types';
            matches.push({
              node,
              message: `Property '${propName}' will be extracted to separate '${newType}' output target`,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }

      // Look for esmLoaderPath to rename to loaderPath
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'esmLoaderPath'
      ) {
        // Check if this is inside an output target object (has a 'type' property sibling)
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(parent)) {
          const hasTypeProperty = parent.properties.some(
            (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'type',
          );
          if (hasTypeProperty) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            matches.push({
              node,
              message: `Property 'esmLoaderPath' renamed to 'loaderPath' (applies to all module formats)`,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }

      // Look for removed properties: isPrimaryPackageOutputTarget and generateTypeDeclarations
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        (node.name.text === 'isPrimaryPackageOutputTarget' ||
          node.name.text === 'generateTypeDeclarations')
      ) {
        // Check if this is inside an output target object (has a 'type' property sibling)
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(parent)) {
          const hasTypeProperty = parent.properties.some(
            (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'type',
          );
          if (hasTypeProperty) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const propName = node.name.text;
            const reason =
              propName === 'isPrimaryPackageOutputTarget'
                ? 'Package.json validation now auto-detects based on configured outputs'
                : "Types are now auto-generated via the 'types' output target";
            matches.push({
              node,
              message: `Property '${propName}' is removed in v5. ${reason}`,
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

    const oldToNewNames: Record<string, string> = {
      dist: 'loader-bundle',
      'dist-custom-elements': 'standalone',
      'dist-hydrate-script': 'ssr',
      'dist-collection': 'collection',
      'dist-types': 'types',
    };

    // Track output targets that have collectionDir or typesDir to extract
    const outputTargetsToExtract: Array<{
      targetNode: ts.ObjectLiteralExpression;
      collectionDir?: string;
      typesDir?: string;
    }> = [];

    // Find output targets with collectionDir or typesDir
    const findOutputTargetsToExtract = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'outputTargets' &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        for (const element of node.initializer.elements) {
          if (ts.isObjectLiteralExpression(element)) {
            let collectionDir: string | undefined;
            let typesDir: string | undefined;

            for (const prop of element.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                if (prop.name.text === 'collectionDir' && ts.isStringLiteral(prop.initializer)) {
                  collectionDir = prop.initializer.text;
                } else if (prop.name.text === 'typesDir' && ts.isStringLiteral(prop.initializer)) {
                  typesDir = prop.initializer.text;
                }
              }
            }

            if (collectionDir || typesDir) {
              outputTargetsToExtract.push({ targetNode: element, collectionDir, typesDir });
            }
          }
        }
      }
      ts.forEachChild(node, findOutputTargetsToExtract);
    };

    findOutputTargetsToExtract(sourceFile);

    // Collect all modifications sorted by position (descending)
    const modifications: Array<{
      type: 'replace' | 'remove';
      start: number;
      end: number;
      replacement?: string;
    }> = [];

    // Process type renames and collectionDir/typesDir removals
    for (const match of matches) {
      const prop = match.node as ts.PropertyAssignment;
      const propName = (prop.name as ts.Identifier).text;

      if (propName === 'type' && ts.isStringLiteral(prop.initializer)) {
        const oldType = prop.initializer.text;
        const newType = oldToNewNames[oldType];
        if (newType) {
          // Replace just the string value
          const start = prop.initializer.getStart() + 1; // +1 to skip opening quote
          const end = prop.initializer.getEnd() - 1; // -1 to skip closing quote
          modifications.push({
            type: 'replace',
            start,
            end,
            replacement: newType,
          });
        }
      } else if (propName === 'esmLoaderPath') {
        // Rename property from esmLoaderPath to loaderPath
        const nameNode = prop.name as ts.Identifier;
        modifications.push({
          type: 'replace',
          start: nameNode.getStart(),
          end: nameNode.getEnd(),
          replacement: 'loaderPath',
        });

        // Adjust the path value: prepend '../' since v5's default dir is one level deeper
        // v4 default: dist/, v5 default: dist/loader-bundle/
        if (ts.isStringLiteral(prop.initializer)) {
          const oldPath = prop.initializer.text;
          const newPath = '../' + oldPath;
          modifications.push({
            type: 'replace',
            start: prop.initializer.getStart() + 1, // +1 to skip opening quote
            end: prop.initializer.getEnd() - 1, // -1 to skip closing quote
            replacement: newPath,
          });
        }
      } else if (
        propName === 'collectionDir' ||
        propName === 'typesDir' ||
        propName === 'isPrimaryPackageOutputTarget' ||
        propName === 'generateTypeDeclarations'
      ) {
        // Remove the property entirely (including comma)
        const start = prop.getStart();
        let end = prop.getEnd();

        // Handle trailing comma or leading comma
        const beforeProp = text.slice(0, start).match(/,\s*$/);
        const afterProp = text.slice(end).match(/^\s*,/);

        if (afterProp) {
          end = end + afterProp[0].length;
        } else if (beforeProp) {
          // No trailing comma, remove leading comma instead
          const commaStart = start - beforeProp[0].length;
          modifications.push({ type: 'remove', start: commaStart, end });
          continue;
        }

        modifications.push({ type: 'remove', start, end });
      }
    }

    // Sort by position descending to preserve positions
    modifications.sort((a, b) => b.start - a.start);

    // Apply modifications
    for (const mod of modifications) {
      if (mod.type === 'replace') {
        text = text.slice(0, mod.start) + mod.replacement + text.slice(mod.end);
      } else if (mod.type === 'remove') {
        text = text.slice(0, mod.start) + text.slice(mod.end);
      }
    }

    // Add new output targets for extracted collectionDir and typesDir
    if (outputTargetsToExtract.length > 0) {
      text = addExtractedOutputTargets(text, sourceFile, outputTargetsToExtract);
    }

    // Clean up any empty lines or double commas
    text = text.replace(/,\s*\n\s*\n/g, ',\n');
    text = text.replace(/{\s*\n\s*\n/g, '{\n');
    text = text.replace(/,\s*,/g, ',');

    return text;
  },
};

/**
 * Add new output targets for extracted collectionDir and typesDir.
 * @param text The original source text
 * @param sourceFile The TypeScript source file object
 * @param toExtract An array of objects containing the output target nodes and their collectionDir/typesDir values to extract
 * @returns The modified source text with new output targets added
 */
function addExtractedOutputTargets(
  text: string,
  sourceFile: ts.SourceFile,
  toExtract: Array<{
    targetNode: ts.ObjectLiteralExpression;
    collectionDir?: string;
    typesDir?: string;
  }>,
): string {
  // Find the outputTargets array to append to
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

  if (!outputTargetsArray || toExtract.length === 0) {
    return text;
  }

  // Type assertion to help TypeScript understand outputTargetsArray is non-null
  const array: ts.ArrayLiteralExpression = outputTargetsArray;

  // Detect indentation from existing output targets
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

  // Find insertion point (before the closing bracket of the array)
  const lastElement = array.elements[array.elements.length - 1];
  if (!lastElement) {
    return text;
  }

  let insertPos = lastElement.getEnd();

  // Check if there's a trailing comma
  const afterLastElement = text.slice(insertPos).match(/^(\s*,)?/);
  const hasTrailingComma = afterLastElement && afterLastElement[1];
  if (hasTrailingComma) {
    insertPos += afterLastElement[0].length;
  }

  // Build the new output targets to insert
  const newTargets: string[] = [];

  for (const extracted of toExtract) {
    if (extracted.collectionDir) {
      newTargets.push(
        `{\n${indent}  type: 'collection',\n${indent}  dir: '${extracted.collectionDir}',\n${indent}}`,
      );
    }
    if (extracted.typesDir) {
      newTargets.push(
        `{\n${indent}  type: 'types',\n${indent}  dir: '${extracted.typesDir}',\n${indent}}`,
      );
    }
  }

  if (newTargets.length === 0) {
    return text;
  }

  // Insert the new targets
  const insertion = ',\n' + newTargets.map((t) => `${indent}${t}`).join(',\n');

  text = text.slice(0, insertPos) + insertion + text.slice(insertPos);

  return text;
}
