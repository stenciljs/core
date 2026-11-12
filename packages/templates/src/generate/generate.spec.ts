import { describe, expect, it } from 'vitest';

import { getComponentBoilerplate } from './component.js';
import { getStyleBoilerplate } from './style.js';

describe('getComponentBoilerplate', () => {
  it('defaults to no encapsulation', () => {
    expect(getComponentBoilerplate('my-button')).toContain("encapsulation: { type: 'none' },");
  });

  it.each(['shadow', 'scoped', 'none'] as const)('writes %s encapsulation', (encapsulation) => {
    expect(getComponentBoilerplate('my-button', { encapsulation })).toContain(
      `encapsulation: { type: '${encapsulation}' },`,
    );
  });

  it('adds a styleUrl only when a style extension is given', () => {
    expect(getComponentBoilerplate('my-button', { styleExtension: 'scss' })).toContain(
      "styleUrl: 'my-button.scss',",
    );
    expect(getComponentBoilerplate('my-button')).not.toContain('styleUrl');
  });
});

describe('getStyleBoilerplate', () => {
  it('targets the tag name when unencapsulated', () => {
    expect(getStyleBoilerplate('my-button', 'css')).toBe('my-button {\n  display: block;\n}\n');
  });

  it.each(['shadow', 'scoped'] as const)('targets :host when %s', (encapsulation) => {
    expect(getStyleBoilerplate('my-button', 'css', encapsulation)).toBe(
      ':host {\n  display: block;\n}\n',
    );
  });

  it('uses indented syntax for sass', () => {
    expect(getStyleBoilerplate('my-button', 'sass')).toBe('my-button\n  display: block\n');
    expect(getStyleBoilerplate('my-button', 'sass', 'shadow')).toBe(':host\n  display: block\n');
  });
});
