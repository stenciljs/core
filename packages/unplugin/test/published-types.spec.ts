import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const entries = ['index.d.mts', 'docs.d.mts'];

describe('@stencil/unplugin published types', () => {
  let program: ts.Program;

  beforeAll(() => {
    program = ts.createProgram(
      entries.map((entry) => join(distDir, entry)),
      // effective consumer tsconfig
      {
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        strict: true,
        noEmit: true,
        // declaration files are only checked when this is off
        skipLibCheck: false,
      },
    );
  });

  it.each(entries)('%s has no unresolved types', (entry) => {
    const sourceFile = program.getSourceFile(join(distDir, entry));
    expect(sourceFile, `${entry} is missing - run the build first`).toBeDefined();

    const diagnostics = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ].map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    expect(diagnostics).toEqual([]);
  });
});
