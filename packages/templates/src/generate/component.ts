import type { ComponentEncapsulation } from '../types.js';

/**
 * Returns the tag name converted to PascalCase for use as a class name.
 *
 * @param str - Dash-case string to convert.
 * @returns PascalCase equivalent of `str`.
 */
export function toPascalCase(str: string): string {
  return str.split('-').reduce((res, part) => res + part[0].toUpperCase() + part.slice(1), '');
}

/**
 * Returns the component TSX boilerplate for `stencil generate`.
 * Uses the v5 `encapsulation` API.
 *
 * @param tagName - Dash-case custom element tag name.
 * @param options - Generation options.
 * @param options.styleExtension - Optional stylesheet extension (e.g. `'css'`, `'scss'`).
 * @param options.encapsulation - Component encapsulation type. Defaults to `'none'`.
 * @returns TSX source string for the new component file.
 */
export function getComponentBoilerplate(
  tagName: string,
  {
    styleExtension,
    encapsulation = 'none',
  }: { styleExtension?: string; encapsulation?: ComponentEncapsulation } = {},
): string {
  const decorator = ['{'];
  decorator.push(`  tag: '${tagName}',`);
  if (styleExtension) {
    decorator.push(`  styleUrl: '${tagName}.${styleExtension}',`);
  }
  decorator.push(`  encapsulation: { type: '${encapsulation}' },`);
  decorator.push('}');

  return `import { Component, Host } from '@stencil/core';

@Component(${decorator.join('\n')})
export class ${toPascalCase(tagName)} {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
`;
}
