import { describe, expect, it } from 'vitest';

import { stubComponentCompilerMeta } from '../../../types/_tests_/ComponentCompilerMeta.stub';
import { generateCustomElementType } from '../standalone-types';

describe('generateCustomElementType', () => {
  it('extends HTMLStencilElement so componentOnReady() is typed', () => {
    const cmpMeta = stubComponentCompilerMeta({ tagName: 'my-button' });

    const result = generateCustomElementType('../types/components', cmpMeta);

    expect(result).toContain(
      'import type { HTMLStencilElement } from "../types/stencil-public-runtime";',
    );
    // types must resolve without `@stencil/core` installed (e.g. when it's a devDependency)
    expect(result).not.toContain('@stencil/core');
    expect(result).toContain(
      'interface MyButton extends Components.MyButton, HTMLStencilElement {}',
    );
    expect(result).not.toContain('HTMLElement {}');
  });
});
