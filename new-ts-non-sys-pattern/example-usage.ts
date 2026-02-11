const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  incremental: true,
};

const host = createCachedIncrementalHost(options);

const compiler = new IncrementalCompiler(
  ["src/index.ts"],
  options,
  host
);

// Initial build
let result = compiler.compile();

for (const [file, code] of result.emittedFiles) {
  console.log("EMIT:", file);
  // -> forward to bundler
  // -> forward to dev server
  // -> forward to HMR runtime
}

// Rebuild (after file changes on disk)
result = compiler.compile();

for (const [file, code] of result.emittedFiles) {
  console.log("UPDATED:", file);
}