import ts from "typescript";

export function createCachedIncrementalHost(
  options: ts.CompilerOptions
): ts.CompilerHost & {
  getEmittedFiles(): Map<string, string>;
  resetEmits(): void;
} {
  const emittedFiles = new Map<string, string>();

  // ---- aggressive caches ----
  const sourceFileCache = new Map<string, ts.SourceFile>();
  const fileTextCache = new Map<string, string | undefined>();
  const fileExistsCache = new Map<string, boolean>();

  const host = ts.createIncrementalCompilerHost(options);

  // ---- normal disk reads, but cached ----
  host.readFile = (fileName) => {
    if (fileTextCache.has(fileName)) {
      return fileTextCache.get(fileName);
    }
    const text = ts.sys.readFile(fileName);
    fileTextCache.set(fileName, text);
    return text;
  };

  host.fileExists = (fileName) => {
    if (fileExistsCache.has(fileName)) {
      return fileExistsCache.get(fileName)!;
    }
    const exists = ts.sys.fileExists(fileName);
    fileExistsCache.set(fileName, exists);
    return exists;
  };

  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (!shouldCreateNewSourceFile) {
      const cached = sourceFileCache.get(fileName);
      if (cached) return cached;
    }

    const text = host.readFile(fileName);
    if (text === undefined) return undefined;

    const sf = ts.createSourceFile(fileName, text, languageVersion);
    sourceFileCache.set(fileName, sf);
    return sf;
  };

  // ---- in-memory emit "stream" ----
  host.writeFile = (fileName, content) => {
    emittedFiles.set(fileName, content);
  };

  return Object.assign(host, {
    getEmittedFiles: () => emittedFiles,
    resetEmits: () => emittedFiles.clear(),
  });
}
