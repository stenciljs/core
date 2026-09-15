export type OutputKey = 'loader' | 'standalone' | 'ssr' | 'ssr-wasm' | 'www';
export type DocKey = 'cem' | 'json' | 'skill' | 'vscode';

export interface PackageJsonFields {
  type?: 'module';
  module?: string;
  types?: string;
}

export interface ConfigSelections {
  namespace: string;
  outputs: ReadonlyArray<OutputKey>;
  signals: boolean;
  docs: ReadonlyArray<DocKey>;
}

/**
 * Returns stencil.config.ts source for the given selections, or null if zero-config
 * covers everything (outputs = [] | ['loader'], no signals, no docs).
 *
 * @param sel - Wizard selections to encode into the config file.
 * @returns TypeScript source string, or null if no config file is needed.
 */
export function generateStencilConfig(sel: ConfigSelections): string | null {
  const hasLoader =
    sel.outputs.length === 0 || (sel.outputs.length === 1 && sel.outputs[0] === 'loader');
  if (hasLoader && !sel.signals && sel.docs.length === 0) return null;

  const outputLines: string[] = [];

  // Empty outputs = loader-bundle is the implicit default. Make it explicit here so that
  // any plugins adding their own outputTargets don't inadvertently drop the loader-bundle.
  if (sel.outputs.includes('loader') || sel.outputs.length === 0)
    outputLines.push(`    { type: 'loader-bundle' },`);
  if (sel.outputs.includes('standalone')) outputLines.push(`    { type: 'standalone' },`);
  if (sel.outputs.includes('ssr')) outputLines.push(`    { type: 'ssr' },`);
  if (sel.outputs.includes('ssr-wasm')) outputLines.push(`    { type: 'ssr-wasm' },`);
  if (sel.outputs.includes('www')) outputLines.push(`    { type: 'www' },`);

  if (sel.docs.includes('cem'))
    outputLines.push(
      `    { type: 'docs-custom-elements-manifest', file: 'custom-elements.json' },`,
    );
  if (sel.docs.includes('json'))
    outputLines.push(`    { type: 'docs-json', file: 'docs/api.json' },`);
  if (sel.docs.includes('skill')) outputLines.push(`    { type: 'docs-agent-skill' },`);
  if (sel.docs.includes('vscode'))
    outputLines.push(`    { type: 'docs-vscode', file: 'vscode-data.json' },`);

  const parts: string[] = [
    `import type { Config } from '@stencil/core';`,
    ``,
    `export const config: Config = {`,
    `  namespace: '${sel.namespace}',`,
  ];

  if (outputLines.length > 0) {
    parts.push(`  outputTargets: [`);
    parts.push(...outputLines);
    parts.push(`  ],`);
  }

  if (sel.signals) {
    parts.push(`  signalBacking: true,`);
  }

  parts.push(`};`);
  parts.push(``);

  return parts.join('\n');
}

/**
 * Returns the package.json distributable fields for the given output selections.
 * Returns an empty object for www-only (non-publishable app mode).
 * Priority: loader > standalone > ssr > ssr-wasm.
 * @param outputs - Wizard output selections to encode into package.json.
 * @returns An object with the fields to write into package.json.
 */
export function generatePackageJsonFields(outputs: ReadonlyArray<OutputKey>): PackageJsonFields {
  const isDefault = outputs.length === 0;
  const has = (key: OutputKey) => outputs.includes(key);

  if (isDefault || has('loader')) {
    return {
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    };
  }
  if (has('standalone')) {
    return {
      type: 'module',
      module: './dist/standalone/index.js',
      types: './dist/types/standalone.d.ts',
    };
  }
  if (has('ssr')) {
    return { type: 'module', module: './dist/ssr/index.js', types: './dist/ssr/index.d.ts' };
  }
  if (has('ssr-wasm')) {
    return {
      type: 'module',
      module: './dist/ssr-wasm/index.js',
      types: './dist/ssr-wasm/plugin.d.ts',
    };
  }
  // www-only: no distributable fields
  return {};
}
