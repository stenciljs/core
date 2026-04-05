import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

/**
 * Migration rule for formAssociated → @AttachInternals.
 *
 * Migrates:
 * - `formAssociated: true` in @Component → Adds `@AttachInternals() internals: ElementInternals;`
 *
 * Note: This is a more complex migration as it needs to add a class member.
 * For now, it detects the issue and provides guidance.
 */
export const formAssociatedRule: MigrationRule = {
  id: 'form-associated',
  name: 'Form Associated',
  description: 'Migrate formAssociated to @AttachInternals decorator',
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
                    "Deprecated 'formAssociated' property found - migrate to @AttachInternals decorator",
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

  transform(sourceFile: ts.SourceFile, matches: MigrationMatch[]): string {
    if (matches.length === 0) {
      return sourceFile.getFullText();
    }

    let text = sourceFile.getFullText();

    // Find the class declaration that contains the @Component decorator
    let classNode: ts.ClassDeclaration | undefined;
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        const decorators = ts.getDecorators(node);
        if (decorators) {
          for (const decorator of decorators) {
            if (
              ts.isCallExpression(decorator.expression) &&
              ts.isIdentifier(decorator.expression.expression) &&
              decorator.expression.expression.text === 'Component'
            ) {
              classNode = node;
              return;
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    // Process matches in reverse order to preserve positions
    const sortedMatches = [...matches].sort((a, b) => {
      const posA = (a.node as ts.Node).getStart();
      const posB = (b.node as ts.Node).getStart();
      return posB - posA;
    });

    for (const match of sortedMatches) {
      const prop = match.node as ts.PropertyAssignment;
      const start = prop.getStart();
      const end = prop.getEnd();

      // Remove the formAssociated property
      let endPos = end;
      const afterProp = text.slice(end).match(/^\s*,/);
      if (afterProp) {
        endPos = end + afterProp[0].length;
      }

      text = text.slice(0, start) + text.slice(endPos);
    }

    // Add @AttachInternals() decorator to the class if we found one
    if (classNode) {
      // Find the opening brace of the class
      const classText = classNode.getText();
      const braceIndex = classText.indexOf('{');
      if (braceIndex !== -1) {
        const insertPos = classNode.getStart() + braceIndex + 1;

        // Check if the class already has an @AttachInternals decorator
        const hasAttachInternals = classText.includes('@AttachInternals');
        if (!hasAttachInternals) {
          // Find the indentation of the class body
          const afterBrace = text.slice(insertPos);
          const indentMatch = afterBrace.match(/^\n(\s*)/);
          const indent = indentMatch ? indentMatch[1] : '  ';

          const newMember = `\n${indent}@AttachInternals() internals: ElementInternals;\n`;
          text = text.slice(0, insertPos) + newMember + text.slice(insertPos);
        }
      }
    }

    return text;
  },
};
