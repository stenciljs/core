import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { getTemplatePath } from '@stencil/templates';
import { detectPackageManager } from 'nypm';
import type { PackageJsonFields } from '@stencil/templates';

/**
 * Copy component-starter template into rootDir, interpolating project name and namespace.
 *
 * @param rootDir - Destination directory (typically `process.cwd()`).
 * @param projectName - Value to substitute for `{{PROJECT_NAME}}` placeholders.
 * @param namespace - Value to substitute for `{{NAMESPACE}}` placeholders.
 * @param stencilVersion - Optional version to substitute for `{{STENCIL_VERSION}}` placeholders.
 */
export async function copyTemplate(
  rootDir: string,
  projectName: string,
  namespace: string,
  stencilVersion?: string,
) {
  const templateDir = getTemplatePath('component-starter');
  const entries = await readdir(templateDir, { recursive: true, withFileTypes: true });
  const resolvedStencilVersion = stencilVersion ? `^${stencilVersion}` : '^5.0.0';

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const srcPath = join(entry.parentPath, entry.name);
    const relPath = relative(templateDir, srcPath);
    const destPath = join(rootDir, relPath);

    await mkdir(dirname(destPath), { recursive: true });

    const content = (await readFile(srcPath, 'utf8'))
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{NAMESPACE\}\}/g, namespace)
      .replace(/\{\{STENCIL_VERSION\}\}/g, resolvedStencilVersion);

    if (relPath === 'package.json') {
      await mergePackageJson(destPath, content);
    } else if (relPath === 'tsconfig.json') {
      await mergeTsConfig(destPath, content);
    } else if (relPath === '.gitignore') {
      await mergeGitignore(destPath, content);
    } else {
      await writeIfAbsent(destPath, content);
    }
  }
}

async function writeIfAbsent(destPath: string, content: string) {
  try {
    await writeFile(destPath, content, { encoding: 'utf8', flag: 'wx' });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
  }
}

async function mergePackageJson(destPath: string, templateContent: string) {
  const template = JSON.parse(templateContent) as Record<string, unknown>;

  let existing: Record<string, unknown>;
  try {
    existing = JSON.parse(await readFile(destPath, 'utf8')) as Record<string, unknown>;
  } catch {
    await writeFile(destPath, templateContent, 'utf8');
    return;
  }

  const dependencies = mergeStringRecord(template.dependencies, existing.dependencies);
  const devDependencies = mergeStringRecord(template.devDependencies, existing.devDependencies);

  // Don't duplicate a package in devDependencies if it's already a direct dependency
  for (const pkg of Object.keys(devDependencies)) {
    if (pkg in dependencies) delete devDependencies[pkg];
  }

  const merged = {
    ...template,
    ...existing,
    scripts: mergeStringRecord(template.scripts, existing.scripts),
    dependencies,
    devDependencies,
  };

  await writeFile(destPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
}

async function mergeTsConfig(destPath: string, templateContent: string) {
  const template = JSON.parse(templateContent) as Record<string, unknown>;

  let existing: Record<string, unknown>;
  try {
    existing = JSON.parse(await readFile(destPath, 'utf8')) as Record<string, unknown>;
  } catch {
    await writeFile(destPath, templateContent, 'utf8');
    return;
  }

  const merged = {
    ...template,
    ...existing,
    compilerOptions: mergeStringRecord(template.compilerOptions, existing.compilerOptions),
  };

  await writeFile(destPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
}

async function mergeGitignore(destPath: string, templateContent: string) {
  let existing: string;
  try {
    existing = await readFile(destPath, 'utf8');
  } catch {
    await writeFile(destPath, templateContent, 'utf8');
    return;
  }

  const existingEntries = new Set(
    existing
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  );
  const missing = templateContent
    .split('\n')
    .filter((line) => line.trim() && !existingEntries.has(line.trim()));

  if (missing.length === 0) return;

  const separator = existing.endsWith('\n') ? '' : '\n';
  await writeFile(destPath, existing + separator + missing.join('\n') + '\n', 'utf8');
}

function mergeStringRecord(base: unknown, override: unknown) {
  const toObj = (v: unknown) =>
    v !== null && typeof v === 'object' ? (v as Record<string, string>) : {};
  return { ...toObj(base), ...toObj(override) };
}

export async function writeStencilConfig(rootDir: string, content: string) {
  await writeFile(join(rootDir, 'stencil.config.ts'), content, 'utf8');
}

export async function writeGlobalStyle(rootDir: string) {
  const path = join(rootDir, 'src', 'global.css');
  await mkdir(dirname(path), { recursive: true });
  await writeIfAbsent(path, `@import "stencil-globals";\n@import "stencil-hydrate";\n`);
}

export async function writeGlobalScript(rootDir: string) {
  const path = join(rootDir, 'src', 'global.ts');
  await mkdir(dirname(path), { recursive: true });
  await writeIfAbsent(path, `export default function (): void {}\n`);
}

function workspaceBuildScript(pm: string | undefined) {
  switch (pm) {
    case 'pnpm':
      return 'pnpm -r build';
    case 'yarn':
      return 'yarn workspaces run build';
    case 'bun':
      return 'bun run --filter "*" build';
    default:
      return 'npm run build --workspaces --if-present';
  }
}

/**
 * Scaffold a workspace root in `cwd`: creates `packages/`, writes the appropriate
 * workspace manifest (`pnpm-workspace.yaml` for pnpm, `workspaces` field in
 * `package.json` for npm / yarn / bun), and ensures a root `package.json` exists.
 * @param cwd - Absolute path to the workspace root (where `package.json` will be created).
 * @param projectName - Name to use for the root package.json (typically the project name).
 * @returns A promise that resolves when the workspace root has been scaffolded.
 */
export async function scaffoldWorkspaceRoot(cwd: string, projectName: string) {
  await mkdir(join(cwd, 'packages'), { recursive: true });

  const pm = await detectPackageManager(cwd);
  const usePnpmYaml = pm?.name === 'pnpm';

  // Root package.json (workspace manifest - private, not published, no project deps)
  const pkgPath = join(cwd, 'package.json');
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>;
  } catch {
    pkg = {};
  }
  // Root is the workspace coordinator, never published — suffix to distinguish from core package.
  pkg.name ??= `${projectName}-workspace`;
  pkg.version ??= '0.0.1';
  pkg.private = true;
  // Recursive build works correctly here because framework wrapper packages declare the core
  // as a workspace dep, so the PM resolves build order from the dependency graph automatically.
  pkg.scripts ??= { build: workspaceBuildScript(pm?.name) };
  if (!usePnpmYaml) {
    pkg.workspaces = ['packages/*'];
  }
  // Workspace roots must not own project deps — they belong in the core package.
  // If the user ran e.g. `npm i @stencil/core` before `stencil init`, those deps
  // would be re-added to packages/core/ by copyTemplate's mergePackageJson.
  delete pkg.dependencies;
  delete pkg.devDependencies;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  if (usePnpmYaml) {
    const yamlPath = join(cwd, 'pnpm-workspace.yaml');
    try {
      await writeFile(yamlPath, `packages:\n  - 'packages/*'\n`, { encoding: 'utf8', flag: 'wx' });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    }
  }
}

/**
 * Write output-driven distributable fields (type, module, types) into package.json.
 * These fields depend on which outputs the user selected, so they cannot be static in the template.
 * Skips if fields is empty (e.g. www-only project).
 *
 * @param rootDir - Absolute path to the project root.
 * @param fields - Fields to write, from generatePackageJsonFields().
 */
export async function applyPackageJsonFields(rootDir: string, fields: PackageJsonFields) {
  if (Object.keys(fields).length === 0) return;

  const pkgPath = join(rootDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>;
  Object.assign(pkg, fields);
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}
