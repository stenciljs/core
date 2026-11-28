import { describe, expect, it } from 'vitest';

import { autoprefixCss } from '../autoprefixer';

describe('autoprefixCss', () => {
  it('names the selector for a pseudo-class after a pseudo-element', async () => {
    const css = `.a { color: red; }\n.b::before:dir(rtl) { left: unset; }`;
    const { diagnostics } = await autoprefixCss(css, null, '/src/cmp.css');

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe(
      `Invalid CSS selector ".b::before:dir(rtl)": Invalid state. A pseudo-class can't follow a pseudo-element (e.g. \`::before:dir(rtl)\`); move it before (\`:dir(rtl)::before\`).`,
    );
    expect(diagnostics[0].absFilePath).toBe('/src/cmp.css');
    expect(diagnostics[0].lineNumber).toBe(2);
  });

  it('names one selector from a selector list', async () => {
    const css = `.a,\n.b::before:hover:dir(rtl) { left: unset; }`;
    const { diagnostics } = await autoprefixCss(css, null);

    expect(diagnostics[0].messageText).toContain('.b::before:hover:dir(rtl)');
  });

  it('keeps the original message for non-selector errors', async () => {
    const { diagnostics } = await autoprefixCss(`.a { color: red; } }`, null);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Unexpected end of input');
  });
});
