import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * NodeResolve fields that were valid in @rollup/plugin-node-resolve but don't exist
 * in rolldown's native resolver and should be removed.
 */
const REMOVED_NODE_RESOLVE_FIELDS = new Set([
  'browser',
  'modulePaths',
  'dedupe',
  'jail',
  'modulesOnly',
  'preferBuiltins',
  'resolveOnly',
  'rootDir',
  'allowExportsFolderMapping',
]);

/** Fields renamed between @rollup/plugin-node-resolve and rolldown's native resolver. */
const RENAMED_NODE_RESOLVE_FIELDS: Record<string, string> = {
  exportConditions: 'conditionNames',
  moduleDirectories: 'modules',
};

function isInsideNodeResolve(node: ts.Node): boolean {
  const parent = node.parent;
  if (!ts.isObjectLiteralExpression(parent)) return false;
  const grandParent = parent.parent;
  return (
    ts.isPropertyAssignment(grandParent) &&
    ts.isIdentifier(grandParent.name) &&
    grandParent.name.text === 'nodeResolve'
  );
}

/**
 * Migration rule for rolldown-related config changes in Stencil v5.
 *
 * Handles:
 * - `rollupConfig` → `rolldownConfig` (key rename + flatten `inputOptions`)
 * - `rolldownConfig: { inputOptions: { ... } }` → `rolldownConfig: { ... }` (flatten)
 * - `rollupPlugins` → `rolldownPlugins`
 * - `nodeResolve.exportConditions` → `nodeResolve.conditionNames`
 * - `nodeResolve.moduleDirectories` → `nodeResolve.modules`
 * - Removes unsupported `nodeResolve` fields (`browser`, `dedupe`, `jail`, etc.)
 */
export const rolldownConfigRule: MigrationRule = {
  id: 'rolldown-config',
  name: 'Rolldown Config Migration',
  description: 'Migrate rollup/rolldown config options to v5 rolldown-native API',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        if (name === 'rollupPlugins') {
          matches.push({
            node,
            message: `'rollupPlugins' renamed to 'rolldownPlugins'`,
            line: line + 1,
            column: character + 1,
          });
        } else if (name === 'rollupConfig' || name === 'rolldownConfig') {
          const value = node.initializer;
          const needsFlatten =
            name === 'rollupConfig' ||
            (ts.isObjectLiteralExpression(value) &&
              value.properties.some(
                (p) =>
                  ts.isPropertyAssignment(p) &&
                  ts.isIdentifier(p.name) &&
                  p.name.text === 'inputOptions',
              ));

          if (needsFlatten) {
            matches.push({
              node,
              message:
                name === 'rollupConfig'
                  ? `'rollupConfig' renamed to 'rolldownConfig'; 'inputOptions' wrapper removed`
                  : `'rolldownConfig.inputOptions' wrapper removed — options are now top-level`,
              line: line + 1,
              column: character + 1,
            });
          }
        } else if (name in RENAMED_NODE_RESOLVE_FIELDS && isInsideNodeResolve(node)) {
          matches.push({
            node,
            message: `'nodeResolve.${name}' renamed to 'nodeResolve.${RENAMED_NODE_RESOLVE_FIELDS[name]}'`,
            line: line + 1,
            column: character + 1,
          });
        } else if (REMOVED_NODE_RESOLVE_FIELDS.has(name) && isInsideNodeResolve(node)) {
          matches.push({
            node,
            message: `'nodeResolve.${name}' is not supported by rolldown's native resolver and will be removed`,
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

    type Edit = { start: number; end: number; replacement: string };
    const edits: Edit[] = [];
    const fullText = sourceFile.getFullText();

    for (const match of matches) {
      const node = match.node as ts.PropertyAssignment;
      const name = (node.name as ts.Identifier).text;

      if (name === 'rollupPlugins') {
        const nameStart = node.name.getStart(sourceFile);
        const nameEnd = node.name.getEnd();
        edits.push({ start: nameStart, end: nameEnd, replacement: 'rolldownPlugins' });
        continue;
      }

      if (name in RENAMED_NODE_RESOLVE_FIELDS && isInsideNodeResolve(node)) {
        const nameStart = node.name.getStart(sourceFile);
        const nameEnd = node.name.getEnd();
        edits.push({
          start: nameStart,
          end: nameEnd,
          replacement: RENAMED_NODE_RESOLVE_FIELDS[name],
        });
        continue;
      }

      if (REMOVED_NODE_RESOLVE_FIELDS.has(name) && isInsideNodeResolve(node)) {
        const start = node.getFullStart();
        const end = node.getEnd();
        const trailingComma = fullText.slice(end).match(/^\s*,/);
        edits.push({
          start,
          end: trailingComma ? end + trailingComma[0].length : end,
          replacement: '',
        });
        continue;
      }

      // rollupConfig / rolldownConfig: rename + flatten inputOptions
      if (name === 'rollupConfig' || name === 'rolldownConfig') {
        const value = node.initializer;

        if (!ts.isObjectLiteralExpression(value)) {
          if (name === 'rollupConfig') {
            const nameStart = node.name.getStart(sourceFile);
            edits.push({
              start: nameStart,
              end: node.name.getEnd(),
              replacement: 'rolldownConfig',
            });
          }
          continue;
        }

        const inputOptionsProp = value.properties.find(
          (p): p is ts.PropertyAssignment =>
            ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'inputOptions',
        );

        if (!inputOptionsProp) {
          // No inputOptions to flatten — just rename the key if needed
          if (name === 'rollupConfig') {
            const nameStart = node.name.getStart(sourceFile);
            edits.push({
              start: nameStart,
              end: node.name.getEnd(),
              replacement: 'rolldownConfig',
            });
          }
          continue;
        }

        // Replace the entire `rollupConfig/rolldownConfig: { inputOptions: { ... }, ... }`
        // with `rolldownConfig: <inputOptions value>`
        const newValueText = inputOptionsProp.initializer.getText(sourceFile);
        const keyStart = node.name.getStart(sourceFile);
        edits.push({
          start: keyStart,
          end: node.getEnd(),
          replacement: `rolldownConfig: ${newValueText}`,
        });
      }
    }

    edits.sort((a, b) => b.start - a.start);
    let text = fullText;
    for (const edit of edits) {
      text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
    }
    return text;
  },
};
