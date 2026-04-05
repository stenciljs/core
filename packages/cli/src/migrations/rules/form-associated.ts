import ts from 'typescript';

import type { MigrationMatch, MigrationRule } from '../index';

interface FormAssociatedMatch extends MigrationMatch {
  classBodyStart: number;
  hasAttachInternals: boolean;
  indent: string;
  needsImport: boolean;
  stencilImportEnd: number;
}

/**
 * Migration rule for formAssociated → @AttachInternals.
 *
 * Migrates:
 * - `formAssociated: true` in @Component → Adds `@AttachInternals() internals: ElementInternals;`
 */
export const formAssociatedRule: MigrationRule = {
  id: 'form-associated',
  name: 'Form Associated',
  description: 'Migrate formAssociated to @AttachInternals decorator',
  fromVersion: '4.x',
  toVersion: '5.x',

  detect(sourceFile: ts.SourceFile): MigrationMatch[] {
    const matches: FormAssociatedMatch[] = [];

    // First, find the @stencil/core import to check if AttachInternals is imported
    let hasAttachInternalsImport = false;
    let stencilImportEnd = 0;

    for (const statement of sourceFile.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === '@stencil/core'
      ) {
        stencilImportEnd = statement.getEnd();
        const namedBindings = statement.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const element of namedBindings.elements) {
            if (element.name.text === 'AttachInternals') {
              hasAttachInternalsImport = true;
              break;
            }
          }
        }
        break;
      }
    }

    const visit = (node: ts.Node) => {
      // Look for class declarations with @Component decorator
      if (ts.isClassDeclaration(node)) {
        const decorators = ts.getDecorators(node);
        if (!decorators) {
          ts.forEachChild(node, visit);
          return;
        }

        // Find @Component decorator
        let componentDecorator: ts.Decorator | undefined;
        let formAssociatedProp: ts.PropertyAssignment | undefined;

        for (const decorator of decorators) {
          if (
            ts.isCallExpression(decorator.expression) &&
            ts.isIdentifier(decorator.expression.expression) &&
            decorator.expression.expression.text === 'Component'
          ) {
            componentDecorator = decorator;
            const [arg] = decorator.expression.arguments;
            if (arg && ts.isObjectLiteralExpression(arg)) {
              for (const prop of arg.properties) {
                if (
                  ts.isPropertyAssignment(prop) &&
                  ts.isIdentifier(prop.name) &&
                  prop.name.text === 'formAssociated'
                ) {
                  formAssociatedProp = prop;
                  break;
                }
              }
            }
            break;
          }
        }

        if (componentDecorator && formAssociatedProp) {
          // Check if class already has @AttachInternals
          let hasAttachInternals = false;
          for (const member of node.members) {
            if (ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) {
              const memberDecorators = ts.getDecorators(member);
              if (memberDecorators) {
                for (const d of memberDecorators) {
                  if (
                    ts.isCallExpression(d.expression) &&
                    ts.isIdentifier(d.expression.expression) &&
                    d.expression.expression.text === 'AttachInternals'
                  ) {
                    hasAttachInternals = true;
                    break;
                  }
                }
              }
            }
          }

          // Find class body start (opening brace) - must be AFTER class name/heritage clauses
          // node.getText() includes decorators, so we can't just indexOf('{')
          let searchStart = node.name ? node.name.getEnd() : node.getStart(sourceFile);

          // Skip past heritage clauses (extends/implements)
          if (node.heritageClauses) {
            for (const clause of node.heritageClauses) {
              searchStart = Math.max(searchStart, clause.getEnd());
            }
          }

          // Find the { after the class name/heritage
          const textAfterName = sourceFile.getFullText().slice(searchStart);
          const braceMatch = textAfterName.match(/\s*\{/);
          if (!braceMatch) {
            ts.forEachChild(node, visit);
            return;
          }
          const classBodyStart = searchStart + braceMatch[0].length;

          // Determine indentation from first member or default
          let indent = '  ';
          if (node.members.length > 0) {
            const firstMember = node.members[0];
            const memberStart = firstMember.getStart(sourceFile);
            const textBefore = sourceFile.getFullText().slice(classBodyStart, memberStart);
            const indentMatch = textBefore.match(/\n(\s+)/);
            if (indentMatch) {
              indent = indentMatch[1];
            }
          }

          const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            formAssociatedProp.getStart(),
          );

          matches.push({
            node: formAssociatedProp,
            message: hasAttachInternals
              ? "Remove 'formAssociated' (already has @AttachInternals)"
              : "Migrate 'formAssociated' to @AttachInternals decorator",
            line: line + 1,
            column: character + 1,
            classBodyStart,
            hasAttachInternals,
            indent,
            needsImport: !hasAttachInternalsImport && !hasAttachInternals,
            stencilImportEnd,
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
    const typedMatches = matches as FormAssociatedMatch[];

    // Sort by position descending (process from end to start)
    const sortedMatches = [...typedMatches].sort((a, b) => {
      return b.classBodyStart - a.classBodyStart;
    });

    for (const match of sortedMatches) {
      // First, add @AttachInternals if needed (do this first since it's later in file)
      if (!match.hasAttachInternals) {
        const newMember = `\n${match.indent}@AttachInternals() internals: ElementInternals;\n`;
        text = text.slice(0, match.classBodyStart) + newMember + text.slice(match.classBodyStart);
      }

      // Then remove formAssociated property (earlier in file, so positions still valid)
      const prop = match.node as ts.PropertyAssignment;
      const start = prop.getStart();
      let end = prop.getEnd();

      // Handle trailing comma
      const afterProp = text.slice(end).match(/^\s*,/);
      if (afterProp) {
        end = end + afterProp[0].length;
      }

      text = text.slice(0, start) + text.slice(end);
    }

    // Add AttachInternals to import if needed (only once, check first match)
    const firstMatch = typedMatches[0];
    if (firstMatch?.needsImport && firstMatch.stencilImportEnd > 0) {
      // Find the import statement and add AttachInternals to it
      const importMatch = text.match(/import\s*\{([^}]*)\}\s*from\s*['"]@stencil\/core['"]/);
      if (importMatch) {
        const existingImports = importMatch[1];
        const newImports = existingImports.trimEnd() + ', AttachInternals';
        text = text.replace(importMatch[0], `import {${newImports}} from '@stencil/core'`);
      }
    }

    return text;
  },
};
