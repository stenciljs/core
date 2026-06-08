import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { getTemplatePath } from '@stencil/templates';

/**
 * Copy component-starter template into rootDir, interpolating project name and namespace.
 *
 * @param rootDir - Destination directory (typically `process.cwd()`).
 * @param projectName - Value to substitute for `{{PROJECT_NAME}}` placeholders.
 * @param namespace - Value to substitute for `{{NAMESPACE}}` placeholders.
 */
export async function copyTemplate(
  rootDir: string,
  projectName: string,
  namespace: string,
): Promise<void> {
  const templateDir = getTemplatePath('component-starter');
  const entries = await readdir(templateDir, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const srcPath = join(entry.parentPath, entry.name);
    const relPath = relative(templateDir, srcPath);
    const destPath = join(rootDir, relPath);

    await mkdir(dirname(destPath), { recursive: true });

    const content = (await readFile(srcPath, 'utf8'))
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{NAMESPACE\}\}/g, namespace);

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

async function writeIfAbsent(destPath: string, content: string): Promise<void> {
  try {
    await writeFile(destPath, content, { encoding: 'utf8', flag: 'wx' });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
  }
}

async function mergePackageJson(destPath: string, templateContent: string): Promise<void> {
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
    scripts: mergeStringRecord(template.scripts, existing.scripts),
    dependencies: mergeStringRecord(template.dependencies, existing.dependencies),
    devDependencies: mergeStringRecord(template.devDependencies, existing.devDependencies),
  };

  await writeFile(destPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
}

async function mergeTsConfig(destPath: string, templateContent: string): Promise<void> {
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

async function mergeGitignore(destPath: string, templateContent: string): Promise<void> {
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

function mergeStringRecord(base: unknown, override: unknown): Record<string, string> {
  const toObj = (v: unknown) =>
    v !== null && typeof v === 'object' ? (v as Record<string, string>) : {};
  return { ...toObj(base), ...toObj(override) };
}

export async function writeStencilConfig(rootDir: string, content: string): Promise<void> {
  await writeFile(join(rootDir, 'stencil.config.ts'), content, 'utf8');
}

export async function writeGlobalStyle(rootDir: string): Promise<void> {
  const path = join(rootDir, 'src', 'global.css');
  await mkdir(dirname(path), { recursive: true });
  await writeIfAbsent(path, `@import "stencil-globals";\n@import "stencil-hydrate";\n`);
}

export async function writeGlobalScript(rootDir: string): Promise<void> {
  const path = join(rootDir, 'src', 'global.ts');
  await mkdir(dirname(path), { recursive: true });
  await writeIfAbsent(path, `export default function (): void {}\n`);
}

/**
 * Inject integration package names into the project's package.json devDependencies.
 * Versions are set to 'latest' so the subsequent install resolves them from the registry.
 *
 * @param rootDir - Absolute path to the project root.
 * @param integrations - npm package names to add as devDependencies.
 */
export async function patchPackageJson(rootDir: string, integrations: string[]): Promise<void> {
  if (integrations.length === 0) return;

  const pkgPath = join(rootDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;

  for (const name of integrations) {
    devDeps[name] = 'latest';
  }
  pkg.devDependencies = devDeps;

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}
