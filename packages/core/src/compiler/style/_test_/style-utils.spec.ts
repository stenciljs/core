import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { addStencilVirtualImportHints } from '../style-utils';

// shaped like the diagnostic @stencil/sass raises for a bare `@import "stencil-component-globals"`
const sassError = (importLine: string): d.Diagnostic => ({
  level: 'error',
  type: 'css',
  header: 'sass error',
  messageText: "Can't find stylesheet to import.\n  ",
  lineNumber: 2,
  lines: [
    { lineIndex: 0, lineNumber: 1, text: ':root{--a:1}', errorCharStart: -1, errorLength: -1 },
    { lineIndex: 1, lineNumber: 2, text: importLine, errorCharStart: 8, errorLength: 17 },
    { lineIndex: 2, lineNumber: 3, text: '', errorCharStart: -1, errorLength: -1 },
  ],
});

describe('addStencilVirtualImportHints', () => {
  it('suggests the url() form for a Sass error on a virtual import', () => {
    const diagnostic = sassError('@import "stencil-component-globals";');

    addStencilVirtualImportHints([diagnostic], '/src/global.scss');

    expect(diagnostic.messageText).toContain("Can't find stylesheet to import.");
    expect(diagnostic.messageText).toContain('@import url("stencil-component-globals");');
  });

  it('suggests the (css) form for Less, reading the name from the message', () => {
    const diagnostic: d.Diagnostic = {
      level: 'error',
      type: 'css',
      messageText: "'stencil-css-components' wasn't found.",
      lines: [],
    };

    addStencilVirtualImportHints([diagnostic], '/src/global.less');

    expect(diagnostic.messageText).toContain('@import (css) "stencil-css-components";');
  });

  it('suggests the filter option for postcss-import, which resolves every form', () => {
    const diagnostic: d.Diagnostic = {
      level: 'error',
      type: 'css',
      messageText: "Failed to find 'stencil-component-globals' in [ /src ]",
      lines: [],
    };

    addStencilVirtualImportHints([diagnostic], '/src/global.css');

    expect(diagnostic.messageText).toContain('postcssImport({ filter:');
    expect(diagnostic.messageText).not.toContain('@import url(');
  });

  it('leaves errors on other lines alone', () => {
    const diagnostic = sassError('@import "missing-partial";');
    diagnostic.lines[0].text = '/* uses stencil-component-globals below */';

    addStencilVirtualImportHints([diagnostic], '/src/global.scss');

    expect(diagnostic.messageText).toBe("Can't find stylesheet to import.\n  ");
  });

  it('leaves warnings alone', () => {
    const diagnostic = {
      ...sassError('@import "stencil-component-globals";'),
      level: 'warn' as const,
    };

    addStencilVirtualImportHints([diagnostic], '/src/global.scss');

    expect(diagnostic.messageText).toBe("Can't find stylesheet to import.\n  ");
  });
});
