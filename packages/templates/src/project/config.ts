export type OutputKey = 'loader' | 'standalone' | 'ssr' | 'ssr-wasm' | 'www';
export type DocKey = 'cem' | 'json' | 'vscode';

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

  if (sel.outputs.includes('loader')) outputLines.push(`    { type: 'loader-bundle' },`);
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
    parts.push(`  extras: {`);
    parts.push(`    signalBacking: true,`);
    parts.push(`  },`);
  }

  parts.push(`};`);
  parts.push(``);

  return parts.join('\n');
}
