import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockComponentMeta, mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { normalizePath } from '../../../utils';
import { transformCssToEsm } from '../../style/css-to-esm';
import { collectStyleDocs } from '../collect-style-docs';

describe('collectStyleDocs', () => {
  const stylePath = normalizePath(path.resolve('/src/components/my-cmp/my-cmp.css'));
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  let cmp: d.ComponentCompilerMeta;
  let transformSpy: ReturnType<typeof vi.fn<typeof transformCssToEsm>>;

  const externalStyle = (absolutePath: string): d.ExternalStyleCompiler => ({
    absolutePath,
    relativePath: path.basename(absolutePath),
    originalComponentPath: absolutePath,
  });

  beforeEach(async () => {
    config = mockValidatedConfig({ outputTargets: [{ type: 'docs-json', file: 'docs.json' }] });
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    transformSpy = vi.fn(transformCssToEsm);
    compilerCtx.worker = {
      transformCssToEsm: transformSpy,
    } as Partial<d.CompilerWorkerContext> as d.CompilerWorkerContext;

    cmp = mockComponentMeta({
      tagName: 'my-cmp',
      styleDocs: [],
      styles: [
        {
          modeName: '$',
          styleId: 'MY-CMP',
          styleStr: null,
          styleIdentifier: 'myCmpStyle',
          externalStyles: [externalStyle(stylePath)],
        },
      ],
    });
    buildCtx.components = [cmp];

    await compilerCtx.fs.writeFile(
      stylePath,
      `:host {
        /**
         * @prop --my-color: The color
         */
        color: var(--my-color);
      }`,
    );
  });

  it('extracts style docs without a bundler having transformed the stylesheet', async () => {
    await collectStyleDocs(config, compilerCtx, buildCtx);

    expect(cmp.styleDocs).toEqual([
      expect.objectContaining({ name: '--my-color', docs: 'The color', annotation: 'prop' }),
    ]);
    expect(buildCtx.diagnostics).toEqual([]);
  });

  it('reuses a stylesheet the bundler already transformed', async () => {
    const styleDocs: d.StyleDoc[] = [
      { name: '--from-cache', docs: '', annotation: 'prop', mode: undefined },
    ];
    compilerCtx.cssTransformCache.set(`${stylePath}?tag=my-cmp&encapsulation=shadow`, {
      pluginTransformId: stylePath,
      pluginTransformCode: '',
      pluginTransformDependencies: [],
      pluginTransformDiagnostics: [],
      cssTransformOutput: { styleDocs } as d.TransformCssToEsmOutput,
    });

    await collectStyleDocs(config, compilerCtx, buildCtx);

    expect(transformSpy).not.toHaveBeenCalled();
    expect(cmp.styleDocs).toEqual(styleDocs);
  });

  it('does not transform the same stylesheet twice across builds', async () => {
    await collectStyleDocs(config, compilerCtx, buildCtx);
    await collectStyleDocs(config, compilerCtx, buildCtx);

    expect(transformSpy).toHaveBeenCalledTimes(1);
    expect(cmp.styleDocs).toHaveLength(1);
  });

  it('keeps style docs separate per mode', async () => {
    const iosPath = normalizePath(path.resolve('/src/components/my-cmp/my-cmp.ios.css'));
    await compilerCtx.fs.writeFile(iosPath, `/** @prop --ios-only: iOS */ :host {}`);
    cmp.styles.push({
      modeName: 'ios',
      styleId: 'MY-CMP#ios',
      styleStr: null,
      styleIdentifier: 'myCmpIosStyle',
      externalStyles: [externalStyle(iosPath)],
    });

    await collectStyleDocs(config, compilerCtx, buildCtx);

    expect(cmp.styleDocs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '--ios-only', mode: 'ios' }),
        expect.objectContaining({ name: '--my-color' }),
      ]),
    );
  });

  it('skips collection dependencies', async () => {
    cmp.isCollectionDependency = true;

    await collectStyleDocs(config, compilerCtx, buildCtx);

    expect(transformSpy).not.toHaveBeenCalled();
    expect(cmp.styleDocs).toEqual([]);
  });

  it('ignores a stylesheet that cannot be read', async () => {
    cmp.styles[0].externalStyles = [externalStyle(normalizePath(path.resolve('/nope.css')))];

    await collectStyleDocs(config, compilerCtx, buildCtx);

    expect(cmp.styleDocs).toEqual([]);
  });
});
