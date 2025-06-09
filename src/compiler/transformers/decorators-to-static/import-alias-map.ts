import ts from 'typescript';

import { STENCIL_DECORATORS, StencilDecorator } from './decorators-constants';

export class ImportAliasMap extends Map<StencilDecorator, string> {
  constructor(sourceFile: ts.SourceFile) {
    super();
    this.generateImportAliasMap(sourceFile);
  }

  /**
   * Parses a {@link ts.SourceFile} and generates a map of all imported Stencil decorators
   * to their aliases import name (if one exists).
   *
   * @param sourceFile The source file to parse
   */
  private generateImportAliasMap(sourceFile: ts.SourceFile) {
    const importDeclarations = sourceFile.statements.filter(ts.isImportDeclaration);

    for (const importDeclaration of importDeclarations) {
      if (importDeclaration.moduleSpecifier.getText().includes('@stencil/core')) {
        const namedBindings = importDeclaration.importClause?.namedBindings;

        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const element of namedBindings.elements) {
            const importName = element.name.getText();
            const originalImportName = element.propertyName?.getText() ?? importName;

            // We only care to generate a map for the Stencil decorators
            if (STENCIL_DECORATORS.includes(originalImportName as StencilDecorator)) {
              this.set(originalImportName as StencilDecorator, importName);
            }
          }
        }
      }
    }
  }

  override get(key: StencilDecorator): string {
    return super.get(key) ?? key;
  }
}
