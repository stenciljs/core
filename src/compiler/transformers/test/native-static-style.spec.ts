import { mockBuildCtx } from '@stencil/core/testing';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { addNativeStaticStyle } from '../component-native/native-static-style';

describe('native static style', () => {
  it('exposes a source map for a single external default style', () => {
    const buildCtx = mockBuildCtx();
    (buildCtx.config as any).sourceMapCss = true;
    const component = {
      componentClassName: 'MyComponent',
      tagName: 'my-component',
      encapsulation: 'shadow',
      styles: [
        {
          modeName: '$',
          externalStyles: [{ absolutePath: '/path/to/style.css' }],
        },
      ],
    } as d.ComponentCompilerMeta;
    const classMembers: ts.ClassElement[] = [];

    addNativeStaticStyle(classMembers, component, buildCtx);

    expect(classMembers).toHaveLength(2);
    expect(ts.isGetAccessor(classMembers[0])).toBe(true);
    expect(ts.isIdentifier((classMembers[0] as ts.GetAccessorDeclaration).name)).toBe(true);
    expect(((classMembers[0] as ts.GetAccessorDeclaration).name as ts.Identifier).text).toBe('style');
    expect(ts.isGetAccessor(classMembers[1])).toBe(true);
    expect(ts.isIdentifier((classMembers[1] as ts.GetAccessorDeclaration).name)).toBe(true);
    expect(((classMembers[1] as ts.GetAccessorDeclaration).name as ts.Identifier).text).toBe('sourceMap');
  });
});
