import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for formAssociated → @AttachInternals.
 *
 * This migration is detection-only because it requires adding a class member,
 * which is complex to do correctly with text manipulation.
 *
 * Users should manually:
 * 1. Remove `formAssociated: true` from @Component
 * 2. Add `@AttachInternals() internals: ElementInternals;` as a class property
 * 3. Import `AttachInternals` from '@stencil/core'
 */
export const formAssociatedRule: MigrationRule = {
  id: 'form-associated',
  name: 'Form Associated (manual)',
  description: 'Detect formAssociated usage - requires manual migration to @AttachInternals',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: MigrationMatch[] = [];

    const visit = (node: ts.Node) => {
      // Look for @Component decorator
      if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
        const decoratorName = node.expression.expression;
        if (ts.isIdentifier(decoratorName) && decoratorName.text === 'Component') {
          const [arg] = node.expression.arguments;
          if (arg && ts.isObjectLiteralExpression(arg)) {
            // Check for formAssociated property
            for (const prop of arg.properties) {
              if (
                ts.isPropertyAssignment(prop) &&
                ts.isIdentifier(prop.name) &&
                prop.name.text === 'formAssociated'
              ) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                  prop.getStart(),
                );
                matches.push({
                  node: prop,
                  message:
                    'Remove formAssociated and add @AttachInternals() decorator to a class property',
                  line: line + 1,
                  column: character + 1,
                });
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return matches;
  },

  // Detection only - no automatic transform for this complex case
  transform(sourceFile: ts.SourceFile, _matches: MigrationMatch[]): string {
    return sourceFile.getFullText();
  },
};
