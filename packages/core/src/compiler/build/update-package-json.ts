import type * as d from '@stencil/core';

import { parsePackageJson } from '../../utils';

export type JsonObject = Record<string, unknown>;

export const isJsonObject = (v: unknown): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Apply an update to the project's `package.json`, keeping its indentation, line endings
 * and key order. Nothing is written if there's no `package.json` or the update changes nothing.
 *
 * @param config The validated Stencil config
 * @param compilerCtx The compiler context
 * @param update Mutates the parsed `package.json`
 * @param immediateWrite Write straight to disk instead of queuing the write for the next commit
 */
export const updatePackageJson = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  update: (pkg: JsonObject) => void,
  immediateWrite = false,
): Promise<void> => {
  const source = await readPackageJsonSource(config, compilerCtx);
  const pkg: unknown = source ? parsePackageJson(source, config.packageJsonFilePath).data : null;
  if (!source || !isJsonObject(pkg)) {
    return;
  }

  const before = JSON.stringify(pkg);
  update(pkg);
  if (JSON.stringify(pkg) === before) {
    return;
  }

  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const indent = /^([ \t]+)"/m.exec(source)?.[1] ?? 2;
  let output = JSON.stringify(pkg, null, indent);
  if (/\n\s*$/.test(source)) {
    output += '\n';
  }
  output = output.replace(/\n/g, eol);

  await compilerCtx.fs.writeFile(config.packageJsonFilePath, output, { immediateWrite });
};

const readPackageJsonSource = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  try {
    return await compilerCtx.fs.readFile(config.packageJsonFilePath);
  } catch {
    return undefined;
  }
};
