export class IncrementalCompiler {
  private builderProgram?: ts.EmitAndSemanticDiagnosticsBuilderProgram;

  constructor(
    private rootNames: string[],
    private options: ts.CompilerOptions,
    private host: ReturnType<typeof createCachedIncrementalHost>
  ) {}

  compile() {
    this.host.resetEmits();

    this.builderProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      this.rootNames,
      this.options,
      this.host,
      this.builderProgram
    );

    const diagnostics = [
      ...this.builderProgram.getOptionsDiagnostics(),
      ...this.builderProgram.getGlobalDiagnostics(),
      ...this.builderProgram.getSyntacticDiagnostics(),
      ...this.builderProgram.getSemanticDiagnostics(),
    ];

    this.builderProgram.emit();

    return {
      diagnostics,
      emittedFiles: new Map(this.host.getEmittedFiles()),
    };
  }
}
