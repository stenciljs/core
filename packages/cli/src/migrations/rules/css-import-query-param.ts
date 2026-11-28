import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Ambient module extensions Stencil declares its own type for. In v5 these
 * now require a `?stencil` query-param marker (see `stencil-ext-modules.d.ts`)
 * so the ambient declaration doesn't clash with other `*.css` etc. typings in
 * a monorepo.
 */
const AMBIENT_ASSET_EXTS = ['.css', '.svg', '.txt', '.frag', '.vert'];

const needsStencilMarker = (specifier: string): boolean => {
  if (specifier.includes('?')) {
    return false;
  }
  const lower = specifier.toLowerCase();
  return AMBIENT_ASSET_EXTS.some((ext) => lower.endsWith(ext));
};

/**
 * Migration rule appending `?stencil` to raw asset import specifiers.
 *
 * Migrates:
 * - `import styles from './my-component.css'` → `import styles from './my-component.css?stencil'`
 * - `import logo from './logo.svg'` → `import logo from './logo.svg?stencil'`
 *
 * Does not touch `styleUrl`/`styleUrls` values in `@Component()` options - those are
 * compiler-resolved filenames, not import specifiers, and are never typed against the
 * ambient module declarations.
 */
export const cssImportQueryParamRule: MigrationRule = {
  id: 'css-import-query-param',
  name: 'Asset Import Query Param',
  description:
    "Append '?stencil' to raw *.css/*.svg/*.txt/*.frag/*.vert imports so they match Stencil's ambient module types",
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      let specifierNode: ts.StringLiteral | undefined;

      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        specifierNode = node.moduleSpecifier;
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length > 0 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        specifierNode = node.arguments[0] as ts.StringLiteral;
      }

      if (specifierNode && needsStencilMarker(specifierNode.text)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          specifierNode.getStart(),
        );
        matches.push({
          node: specifierNode,
          message: `Raw asset import '${specifierNode.text}' needs a '?stencil' suffix to match Stencil's ambient module type`,
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
    if (matches.length === 0) {
      return sourceFile.getFullText();
    }

    let text = sourceFile.getFullText();

    // Process matches in reverse order to preserve positions
    const sortedMatches = [...matches].sort((a, b) => b.node.getStart() - a.node.getStart());

    for (const match of sortedMatches) {
      const node = match.node as ts.StringLiteral;
      const start = node.getStart();
      const end = node.getEnd();
      const quote = node.getText(sourceFile)[0];
      const updated = `${quote}${node.text}?stencil${quote}`;

      text = text.slice(0, start) + updated + text.slice(end);
    }

    return text;
  },
};
