import type * as d from '@stencil/core/declarations';
import { mockBuildCtx } from '@stencil/core/testing';

import { BundleOptions } from '../../../bundle/bundle-interface';
import { stubComponentCompilerMeta } from '../../../types/tests/ComponentCompilerMeta.stub';
import { addCustomElementInputs } from '../index';

describe('dist-custom-elements', () => {
  it('should export plain component', () => {
    const cmpMeta = stubComponentCompilerMeta({ isPlain: true, sourceFilePath: './foo/bar.tsx', tagName: 'my-tag' });
    const buildCtx = mockBuildCtx();
    buildCtx.components = [cmpMeta];
    const bundleOpts: BundleOptions = {
      id: 'customElements',
      platform: 'client',
      inputs: {},
      loader: {},
    };
    const outputTarget: d.OutputTargetDistCustomElements = {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'single-export-module',
    };
    addCustomElementInputs(buildCtx, bundleOpts, outputTarget);
    expect(bundleOpts.loader['\x00MyTag']).toContain("export { StubCmp as MyTag } from './foo/bar.tsx';");
    expect(bundleOpts.loader['\x00core']).toContain(`export { MyTag } from '\x00MyTag';\n`);
  });

  it('should export component with a defineCustomElement function', () => {
    const cmpMeta = stubComponentCompilerMeta({ sourceFilePath: './foo/bar.tsx', tagName: 'my-tag' });
    const buildCtx = mockBuildCtx();
    buildCtx.components = [cmpMeta];
    const bundleOpts: BundleOptions = {
      id: 'customElements',
      platform: 'client',
      inputs: {},
      loader: {},
    };
    const outputTarget: d.OutputTargetDistCustomElements = {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'single-export-module',
    };
    addCustomElementInputs(buildCtx, bundleOpts, outputTarget);
    expect(bundleOpts.loader['\x00MyTag']).toContain('export const defineCustomElement = cmpDefCustomEle;');
    expect(bundleOpts.loader['\x00MyTag']).toContain(
      "import { StubCmp as $CmpMyTag, defineCustomElement as cmpDefCustomEle } from './foo/bar.tsx';",
    );
    expect(bundleOpts.loader['\x00core']).toContain(
      `export { MyTag, defineCustomElement as defineCustomElementMyTag } from '\x00MyTag';\n`,
    );
  });
});
