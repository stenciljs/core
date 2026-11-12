import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockDocument, mockValidatedConfig } from '../../../testing';
import { addScriptDataAttribute } from '../add-script-attr';

describe('addScriptDataAttribute', () => {
  const config = mockValidatedConfig({ fsNamespace: 'app' });
  const outputTarget: d.OutputTargetWww = { type: 'www', dir: '/www', buildDir: '/www/build' };

  const run = (src: string) => {
    const doc = mockDocument(
      `<html><head><script type="module" src="${src}"></script></head></html>`,
    );
    addScriptDataAttribute(config, doc, outputTarget);
    return doc.querySelector('script')!.hasAttribute('data-stencil');
  };

  it('tags the namespace entry', () => {
    expect(run('/build/app.js')).toBe(true);
  });

  it('tags the .esm.js compat shim', () => {
    expect(run('/build/app.esm.js')).toBe(true);
  });

  it('ignores other scripts', () => {
    expect(run('/build/other.js')).toBe(false);
    expect(run('/app.js')).toBe(false);
  });
});
