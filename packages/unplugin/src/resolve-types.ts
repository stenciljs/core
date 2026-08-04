/**
 * Resolves imported type references in CEM docs components.
 *
 * `transpileSync` uses a single-file TypeScript host, so imported types (e.g.
 * `ButtonVariant` from `'../types'`) can't be followed — `complexType.resolved`
 * ends up as `"any"`. This module creates a minimal ts.Program per referenced
 * types file (cached) and substitutes the actual expanded type text back into
 * the component's doc data before it enters the registry.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import type { ComponentCompilerTypeReferences, JsonDocsComponent } from '@stencil/core/compiler';

const TYPE_FORMAT_FLAGS =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.InTypeAlias |
  ts.TypeFormatFlags.InElementType;

interface TypesFileEntry {
  checker: ts.TypeChecker;
  exportTypes: Map<string, ts.Type>;
}

const typesFileCache = new Map<string, TypesFileEntry>();

function resolveTypesFilePath(specifier: string, fromDir: string): string | undefined {
  const base = resolve(fromDir, specifier);
  if (existsSync(base)) return base;
  for (const ext of ['.ts', '.tsx', '.d.ts']) {
    const candidate = base + ext;
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

function getTypesFileEntry(absPath: string): TypesFileEntry {
  const cached = typesFileCache.get(absPath);
  if (cached) return cached;

  const options: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    noEmit: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  const program = ts.createProgram([absPath], options);
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(absPath);
  const exportTypes = new Map<string, ts.Type>();

  if (sourceFile) {
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol) {
      for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
        exportTypes.set(symbol.name, checker.getDeclaredTypeOfSymbol(symbol));
      }
    }
  }

  const entry: TypesFileEntry = { checker, exportTypes };
  typesFileCache.set(absPath, entry);
  return entry;
}

function expandTypeName(
  typeName: string,
  references: ComponentCompilerTypeReferences,
  fromDir: string,
): string | undefined {
  const ref = references[typeName];
  if (!ref || ref.location !== 'import' || !ref.path) return undefined;

  const absPath = resolveTypesFilePath(ref.path, fromDir);
  if (!absPath) return undefined;

  const { checker, exportTypes } = getTypesFileEntry(absPath);
  const type = exportTypes.get(typeName);
  if (!type) return undefined;

  return checker.typeToString(type, undefined, TYPE_FORMAT_FLAGS);
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function patchType(
  original: string,
  references: ComponentCompilerTypeReferences | undefined,
  fromDir: string,
): string {
  if (!references) return original;
  let result = original;
  for (const typeName of Object.keys(references)) {
    const expanded = expandTypeName(typeName, references, fromDir);
    if (!expanded || expanded === typeName) continue;
    // Wrap in parens when substituting into a potentially larger expression
    // e.g. `ButtonVariant | undefined` → `('sm' | 'md') | undefined`
    result = result.replace(
      new RegExp(`\\b${escapeRegExp(typeName)}\\b`, 'g'),
      expanded.includes('|') || expanded.includes('&') ? `(${expanded})` : expanded,
    );
  }
  return result;
}

/**
 * Patches `prop.type` and `event.detail` in-place for any imported types that
 * resolved to `"any"` in single-file transpile mode.
 * @param component The CEM docs component to patch
 * @param componentAbsPath The absolute path to the component's source file (used to resolve relative imports)
 */
export function resolveImportedTypes(component: JsonDocsComponent, componentAbsPath: string): void {
  const dir = dirname(componentAbsPath);

  for (const prop of component.props) {
    if (prop.type !== 'any' || !prop.complexType?.references) continue;
    const patched = patchType(prop.complexType.original, prop.complexType.references, dir);
    if (patched !== prop.complexType.original) prop.type = patched;
  }

  for (const event of component.events) {
    if (event.detail !== 'any' || !event.complexType?.references) continue;
    const patched = patchType(event.complexType.original, event.complexType.references, dir);
    if (patched !== event.complexType.original) event.detail = patched;
  }
}
